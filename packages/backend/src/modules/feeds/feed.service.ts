import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async generatePersonalizedFeed(userId: string, limit = 20, cursor?: string) {
    // 1. Get user's interests and activity
    const userActivity = await this.getUserActivity(userId);

    // 2. Fetch posts from multiple sources
    const [followedPosts, trendingPosts, fundraiserPosts, discoveryPosts] = await Promise.all([
      this.getFollowedPosts(userId, userActivity),
      this.getTrendingPosts(userActivity.interests),
      this.getFundraiserPosts(),
      this.getDiscoveryPosts(userId),
    ]);

    // 3. Merge and rank
    const allPosts = [
      ...followedPosts.map(p => ({ ...p, source: 'followed', weight: 1.0 })),
      ...trendingPosts.map(p => ({ ...p, source: 'trending', weight: 0.7 })),
      ...fundraiserPosts.map(p => ({ ...p, source: 'fundraiser', weight: 0.5 })),
      ...discoveryPosts.map(p => ({ ...p, source: 'discovery', weight: 0.3 })),
    ];

    // 4. Calculate engagement score and sort
    const rankedPosts = allPosts
      .map(post => ({
        ...post,
        score: this.calculateEngagementScore(post, post.weight),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      posts: rankedPosts,
      nextCursor: rankedPosts.length === limit ? rankedPosts[limit - 1].id : null,
    };
  }

  private calculateEngagementScore(post: any, sourceWeight: number): number {
    const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    const ageDecay = Math.exp(-ageInHours / 24); // 24-hour decay

    const engagement =
      post.likesCount * 1 +
      post.commentsCount * 3 +
      post.repostsCount * 5 +
      post.viewsCount * 0.05;

    return engagement * ageDecay * sourceWeight;
  }

  private async getUserActivity(userId: string) {
    const [likes, comments, follows] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId },
        include: { post: { include: { fundraiser: true } } },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.findMany({
        where: { authorId: userId },
        include: { post: { include: { fundraiser: true } } },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
    ]);

    // Extract interests (categories, hashtags, etc.)
    const interests = new Set<string>();
    [...likes, ...comments].forEach(activity => {
      if (activity.post.fundraiser) {
        activity.post.fundraiser.categories.forEach(cat => interests.add(cat));
      }
      activity.post.hashtags.forEach(tag => interests.add(tag));
    });

    return {
      interests: Array.from(interests),
      followedUserIds: follows.map(f => f.followingId),
    };
  }
}