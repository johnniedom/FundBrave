"use client";

import { useState } from "react";
import { Heart, MessageCircle, Repeat2, BarChart3, Bookmark, Share } from "lucide-react";
import { usePosts, Post } from "@/app/provider/PostsContext";
import { CommentSection } from "@/app/components/ui/comments";
import { cn } from "@/lib/utils";

// Format relative time (e.g., "2h ago", "3d ago")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

// Format compact number (e.g., 1234 -> "1.2K")
function formatCompactNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

interface PostCardProps {
  post: Post;
}

/**
 * VerifiedBadge - Blue checkmark for verified users
 */
function VerifiedBadge() {
  return (
    <svg
      className="w-[18px] h-[18px] text-primary"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.04 4.3l-3.71-3.71 1.41-1.41 2.3 2.3 5.3-5.3 1.41 1.41-6.71 6.71z" />
    </svg>
  );
}

/**
 * PostCard - Displays a single post with interactive actions
 */
export function PostCard({ post }: PostCardProps) {
  const {
    likePost,
    unlikePost,
    addComment,
    likeComment,
    unlikeComment,
    replyToComment,
    deleteComment,
  } = usePosts();
  const [showComments, setShowComments] = useState(false);

  const handleLikeClick = () => {
    if (post.isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };

  return (
    <div className="p-4 border-b border-border-subtle hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          {/* Header row with author info and menu */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-white font-bold hover:underline cursor-pointer">
                {post.author.name}
              </span>
              {post.author.isVerified && <VerifiedBadge />}
              <span className="text-white/50">@{post.author.username}</span>
              <span className="text-white/50">·</span>
              <span className="text-white/50">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            {/* Three dots menu */}
            <button className="p-2 -mt-1 -mr-2 rounded-full hover:bg-primary/10 text-white/50 hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
              </svg>
            </button>
          </div>

          {/* Post Content */}
          <p className="text-white mt-0.5 whitespace-pre-wrap leading-normal">
            {post.content}
          </p>

          {/* Post Image */}
          {post.imageUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border-subtle">
              <img
                src={post.imageUrl}
                alt=""
                className="w-full h-auto max-h-[512px] object-cover"
              />
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between mt-3 max-w-md -ml-2">
            {/* Comment */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "flex items-center gap-1 transition-colors group",
                showComments ? "text-primary" : "text-white/50 hover:text-primary"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-[13px]">
                {post.commentsCount > 0 ? post.commentsCount : ""}
              </span>
            </button>

            {/* Repost */}
            <button className="flex items-center gap-1 text-white/50 hover:text-green-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <Repeat2 size={18} />
              </div>
              <span className="text-[13px]">
                {post.sharesCount > 0 ? post.sharesCount : ""}
              </span>
            </button>

            {/* Like */}
            <button
              onClick={handleLikeClick}
              className={cn(
                "flex items-center gap-1 transition-colors group",
                post.isLiked
                  ? "text-pink-500"
                  : "text-white/50 hover:text-pink-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                <Heart
                  size={18}
                  fill={post.isLiked ? "currentColor" : "none"}
                />
              </div>
              <span className="text-[13px]">
                {post.likesCount > 0 ? post.likesCount : ""}
              </span>
            </button>

            {/* Views */}
            <button className="flex items-center gap-1 text-white/50 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <BarChart3 size={18} />
              </div>
              <span className="text-[13px]">
                {formatCompactNumber(post.viewsCount)}
              </span>
            </button>

            {/* Bookmark & Share */}
            <div className="flex items-center">
              <button className="p-2 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-colors">
                <Bookmark size={18} />
              </button>
              <button className="p-2 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-colors">
                <Share size={18} />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-200">
              <CommentSection
                postId={post.id}
                comments={post.comments}
                onAddComment={(content) => addComment(post.id, content)}
                onLikeComment={(commentId) => likeComment(post.id, commentId)}
                onUnlikeComment={(commentId) => unlikeComment(post.id, commentId)}
                onReplyToComment={(commentId, content) =>
                  replyToComment(post.id, commentId, content)
                }
                onDeleteComment={(commentId) => deleteComment(post.id, commentId)}
                showHeader={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PostsTabProps {
  // Optional: pass posts externally (for non-context usage)
  posts?: Post[];
}

/**
 * PostsTab - List of user's posts with full interactivity
 */
export default function PostsTab({ posts: externalPosts }: PostsTabProps) {
  const { posts: contextPosts, isLoading } = usePosts();
  const posts = externalPosts || contextPosts;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        <p className="mb-2">No posts yet</p>
        <p className="text-sm">Create your first post using the button below!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
