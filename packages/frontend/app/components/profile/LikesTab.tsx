"use client";

import {
  MockLike,
  formatRelativeTime,
  formatCompactNumber,
} from "@/lib/constants/mock-profile-activity";

interface LikeCardProps {
  like: MockLike;
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
 * LikeCard - Displays a post the user has liked
 */
export function LikeCard({ like }: LikeCardProps) {
  return (
    <div className="p-4 border-b border-border-subtle hover:bg-white/[0.02] transition-colors cursor-pointer">
      {/* Liked indicator */}
      <div className="flex items-center gap-2 mb-2 text-pink-500 text-xs">
        <svg
          className="w-3.5 h-3.5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <span>You liked this</span>
      </div>

      <div className="flex gap-3">
        <img
          src={like.author.avatar}
          alt={like.author.name}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* Header row with author info and menu */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-white font-bold hover:underline">
                {like.author.name}
              </span>
              {like.author.isVerified && <VerifiedBadge />}
              <span className="text-white/50">@{like.author.username}</span>
              <span className="text-white/50">·</span>
              <span className="text-white/50">
                {formatRelativeTime(like.createdAt)}
              </span>
            </div>
            {/* Three dots menu */}
            <button className="p-2 -mt-1 -mr-2 rounded-full hover:bg-primary/10 text-white/50 hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <p className="text-white mt-0.5 whitespace-pre-wrap leading-normal">
            {like.content}
          </p>

          {/* Image */}
          {like.imageUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border-subtle">
              <img
                src={like.imageUrl}
                alt=""
                className="w-full h-auto max-h-[512px] object-cover"
              />
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between mt-3 max-w-md -ml-2">
            {/* Comment */}
            <button className="flex items-center gap-1 text-white/50 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                  />
                </svg>
              </div>
              <span className="text-[13px]">{like.commentsCount || ""}</span>
            </button>

            {/* Repost */}
            <button className="flex items-center gap-1 text-white/50 hover:text-green-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                  />
                </svg>
              </div>
              <span className="text-[13px]">{like.sharesCount || ""}</span>
            </button>

            {/* Like - filled since user liked it */}
            <button className="flex items-center gap-1 text-pink-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                <svg
                  className="w-[18px] h-[18px]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <span className="text-[13px]">{like.likesCount || ""}</span>
            </button>

            {/* Views */}
            <button className="flex items-center gap-1 text-white/50 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <span className="text-[13px]">
                {formatCompactNumber(like.viewsCount)}
              </span>
            </button>

            {/* Bookmark & Share */}
            <div className="flex items-center">
              <button className="p-2 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-colors">
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </button>
              <button className="p-2 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-colors">
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LikesTabProps {
  likes: MockLike[];
}

/**
 * LikesTab - List of posts/tweets the user has liked
 */
export default function LikesTab({ likes }: LikesTabProps) {
  if (likes.length === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        <p>No likes yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {likes.map((like) => (
        <LikeCard key={like.id} like={like} />
      ))}
    </div>
  );
}
