"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Heart, MessageCircle, Share, Upload, Video, ImageIcon, Send, X, LogIn, Users } from "lucide-react"
import { useSupabase } from "@/hooks/useSupabase"
import { useAI } from "@/hooks/useAI"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"

interface Post {
  id: string
  user_id: string
  content: string
  media_url?: string
  media_type?: "image" | "video"
  likes_count: number
  comments_count: number
  created_at: string
  profiles: {
    id: string
    name: string
    avatar_url?: string
  }
  liked_by_user: boolean
  post_likes: Array<{ user_id: string }>
  post_comments: Array<{ id: string }>
}

interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles: {
    id: string
    name: string
    avatar_url?: string
  }
}

const GlassCard = React.memo(({ children, className = "" }: any) => (
  <div
    className={`bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
    {children}
  </div>
))

GlassCard.displayName = "GlassCard"

const LiquidButton = React.memo(({ children, onClick, variant = "primary", className = "", disabled = false }: any) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white",
    secondary: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
    glass: "bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 backdrop-blur-xl",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        rounded-2xl px-4 py-2 font-medium text-sm
        transform transition-all duration-200 ease-out
        hover:scale-105 active:scale-95
        shadow-lg hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  )
})

LiquidButton.displayName = "LiquidButton"

export default function CommunityScreen({ appState, t, user, signInWithGoogle }: any) {
  const { supabase } = useSupabase()
  const { moderateContent } = useAI()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showComments, setShowComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")

  // Fetch posts with proper relationships
  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            avatar_url
          ),
          post_likes (
            user_id
          ),
          post_comments (
            id
          )
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      const processedPosts = (data || []).map((post: any) => ({
        ...post,
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        liked_by_user: post.post_likes?.some((like: any) => like.user_id === user?.id) || false,
      }))

      setPosts(processedPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
      // Show sample posts if database fails
      setPosts([
        {
          id: "sample-1",
          user_id: "sample",
          content: "Welcome to FLKRD Muslims! 🕌 May Allah bless our community.",
          likes_count: 12,
          comments_count: 3,
          created_at: new Date().toISOString(),
          profiles: { id: "sample", name: "Community Admin", avatar_url: null },
          liked_by_user: false,
          post_likes: [],
          post_comments: [],
        },
        {
          id: "sample-2",
          user_id: "sample",
          content: "SubhanAllah! Beautiful sunset today. Reminded me of Allah's creation. 🌅",
          likes_count: 8,
          comments_count: 1,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          profiles: { id: "sample", name: "Muslim Brother", avatar_url: null },
          liked_by_user: false,
          post_likes: [],
          post_comments: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // Fetch comments for a post
  const fetchComments = useCallback(
    async (postId: string) => {
      try {
        const { data, error } = await supabase
          .from("post_comments")
          .select(`
            *,
            profiles!post_comments_user_id_fkey (
              id,
              name,
              avatar_url
            )
          `)
          .eq("post_id", postId)
          .eq("is_approved", true)
          .order("created_at", { ascending: true })

        if (error) throw error
        setComments(data || [])
      } catch (error) {
        console.error("Error fetching comments:", error)
        setComments([])
      }
    },
    [supabase],
  )

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Auto-show posts after successful login
  useEffect(() => {
    if (user && posts.length === 0 && !loading) {
      fetchPosts()
    }
  }, [user, posts.length, loading, fetchPosts])

  // Handle media selection
  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"]
      if (!allowedTypes.includes(file.type)) {
        alert("Only images (JPEG, PNG, GIF) and videos (MP4, WebM) are allowed")
        return
      }

      setSelectedMedia(file)
      const reader = new FileReader()
      reader.onload = (e) => setMediaPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Upload media to Supabase Storage
  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `posts/${fileName}`

      const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file)
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error uploading media:", error)
      return null
    }
  }

  // Create new post
  const handleCreatePost = async () => {
    if (!user) {
      signInWithGoogle()
      return
    }

    if (!newPostContent.trim() && !selectedMedia) {
      alert("Please add some content or media to your post")
      return
    }

    setUploading(true)

    try {
      const moderation = await moderateContent(newPostContent)
      if (!moderation.approved) {
        alert(`Post blocked: ${moderation.reason}`)
        setUploading(false)
        return
      }

      let mediaUrl = null
      let mediaType = null

      if (selectedMedia) {
        mediaUrl = await uploadMedia(selectedMedia)
        mediaType = selectedMedia.type.startsWith("image/") ? "image" : "video"
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: newPostContent.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        is_approved: true,
      })

      if (error) throw error

      setNewPostContent("")
      setSelectedMedia(null)
      setMediaPreview(null)
      setShowCreatePost(false)
      fetchPosts()
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  // Toggle like
  const handleLike = async (postId: string) => {
    if (!user) {
      signInWithGoogle()
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.liked_by_user) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id })
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked_by_user: !p.liked_by_user,
                likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p,
        ),
      )
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  // Add comment
  const handleAddComment = async (postId: string) => {
    if (!user) {
      signInWithGoogle()
      return
    }

    if (!newComment.trim()) return

    try {
      const moderation = await moderateContent(newComment)
      if (!moderation.approved) {
        alert(`Comment blocked: ${moderation.reason}`)
        return
      }

      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        is_approved: true,
      })

      if (error) throw error

      setNewComment("")
      fetchComments(postId)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)))
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  // Share post
  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FLKRD Muslims - Islamic Community",
          text: post.content,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(`${post.content}\n\n${window.location.href}`)
      alert("Post link copied to clipboard!")
    }
  }

  if (!user) {
    return (
      <div className="space-y-6 animate-in slide-in-from-left duration-500">
        <h2 className="text-3xl font-bold text-gray-800 text-center">{t.community}</h2>
        <GlassCard className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Join Our Islamic Community</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Sign in to share posts, connect with fellow Muslims, and engage in meaningful discussions about Islam.
          </p>
          <LiquidButton onClick={signInWithGoogle} className="px-8 py-3 flex items-center gap-2 mx-auto">
            <LogIn size={18} />
            {t.signInWithGoogle}
          </LiquidButton>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-left duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">{t.community}</h2>
        <LiquidButton onClick={() => setShowCreatePost(true)} className="flex items-center gap-2">
          <Upload size={16} />
          {t.createPost}
        </LiquidButton>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t.createPost}</h3>
              <button
                onClick={() => {
                  setShowCreatePost(false)
                  setNewPostContent("")
                  setSelectedMedia(null)
                  setMediaPreview(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share something inspiring..."
              className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              maxLength={500}
            />

            {mediaPreview && (
              <div className="mt-4 relative">
                {selectedMedia?.type.startsWith("image/") ? (
                  <img
                    src={mediaPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                ) : (
                  <video src={mediaPreview} className="w-full h-48 object-cover rounded-xl" controls />
                )}
                <button
                  onClick={() => {
                    setSelectedMedia(null)
                    setMediaPreview(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleMediaSelect} className="hidden" />
                  <div className="flex items-center gap-1 text-gray-600 hover:text-gray-800">
                    <ImageIcon size={20} />
                    <span className="text-sm">{t.image}</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="video/*" onChange={handleMediaSelect} className="hidden" />
                  <div className="flex items-center gap-1 text-gray-600 hover:text-gray-800">
                    <Video size={20} />
                    <span className="text-sm">{t.video}</span>
                  </div>
                </label>
              </div>
              <LiquidButton onClick={handleCreatePost} disabled={uploading}>
                {uploading ? "Posting..." : "Post"}
              </LiquidButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} lines={4} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <GlassCard key={post.id} className="p-4">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                  {post.profiles?.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url || "/placeholder.svg"}
                      alt={post.profiles.name}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <span className="text-white font-semibold">{post.profiles?.name?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-800 font-medium">{post.profiles?.name || "Anonymous"}</span>
                  <p className="text-gray-500 text-sm">
                    {new Date(post.created_at).toLocaleDateString()} at{" "}
                    {new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-gray-700 mb-3 leading-relaxed">{post.content}</p>

              {/* Post Media */}
              {post.media_url && (
                <div className="mb-3">
                  {post.media_type === "image" ? (
                    <img
                      src={post.media_url || "/placeholder.svg"}
                      alt="Post media"
                      className="w-full h-64 object-cover rounded-2xl"
                    />
                  ) : (
                    <video src={post.media_url} className="w-full h-64 object-cover rounded-2xl" controls />
                  )}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      post.liked_by_user ? "text-red-500" : "text-gray-500 hover:text-red-500"
                    }`}
                  >
                    <Heart size={18} className={post.liked_by_user ? "fill-current" : ""} />
                    <span className="text-sm">{post.likes_count}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowComments(showComments === post.id ? null : post.id)
                      if (showComments !== post.id) {
                        fetchComments(post.id)
                      }
                    }}
                    className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle size={18} />
                    <span className="text-sm">{post.comments_count}</span>
                  </button>
                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors"
                  >
                    <Share size={18} />
                    <span className="text-sm">{t.share}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments === post.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center flex-shrink-0">
                          {comment.profiles?.avatar_url ? (
                            <img
                              src={comment.profiles.avatar_url || "/placeholder.svg"}
                              alt={comment.profiles.name}
                              className="w-full h-full rounded-full"
                            />
                          ) : (
                            <span className="text-white text-xs font-semibold">
                              {comment.profiles?.name?.[0]?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-2xl px-3 py-2">
                            <span className="text-gray-600 text-sm font-medium">
                              {comment.profiles?.name || "Anonymous"}
                            </span>
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                          </div>
                          <span className="text-gray-400 text-xs ml-3">
                            {new Date(comment.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(post.id)
                        }
                      }}
                    />
                    <LiquidButton onClick={() => handleAddComment(post.id)} className="px-3 py-2">
                      <Send size={16} />
                    </LiquidButton>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
