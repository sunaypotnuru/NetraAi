import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  Plus, Edit2, Trash2, FileText, Image as ImageIcon, Search, Filter,
  Eye, Calendar, User, Tag, Globe, BookOpen, MoreVertical, Copy,
  AlertTriangle, CheckCircle, Clock, TrendingUp, Download, RefreshCw, X, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { blogsAPI } from '@/lib/api';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  image_url: string;
  published: boolean;
  featured: boolean;
  tags: string[];
  meta_description: string;
  slug: string;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface BlogsResponse {
  blogs: Blog[];
  total: number;
  total_published: number;
  total_drafts: number;
  popular_tags: string[];
}

export default function AdminBlogsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: 'Netra AI Team',
    image_url: '',
    published: false,
    featured: false,
    tags: [] as string[],
    meta_description: '',
    slug: ''
  });

  const [newTag, setNewTag] = useState('');

  // API call to get blogs using centralized blogsAPI
  const { data: blogsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-blogs', searchTerm, statusFilter, sortBy],
    queryFn: async (): Promise<any> => {
      try {
        const response = await blogsAPI.getBlogs();
        return response.data;
      } catch (err) {
        console.error('Error fetching blogs:', err);
        return [];
      }
    }
  });

  // Create blog mutation
  const createBlogMutation = useMutation({
    mutationFn: (blogData: typeof formData) => blogsAPI.createBlog(blogData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog created successfully');
      setIsFormOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create blog')
  });

  // Update blog mutation
  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => blogsAPI.updateBlog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog updated successfully');
      setIsFormOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update blog')
  });

  // Delete blog mutation
  const deleteBlogMutation = useMutation({
    mutationFn: (blogId: string) => blogsAPI.deleteBlog(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog deleted successfully');
    },
    onError: () => toast.error('Failed to delete blog')
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      author: 'Netra AI Team',
      image_url: '',
      published: false,
      featured: false,
      tags: [],
      meta_description: '',
      slug: ''
    });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a blog title');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Please enter blog content');
      return;
    }

    if (!formData.slug) {
      formData.slug = formData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (!formData.excerpt) {
      formData.excerpt = formData.content.substring(0, 150) + '...';
    }

    if (editingId) {
      updateBlogMutation.mutate({ id: editingId, data: formData });
    } else {
      createBlogMutation.mutate(formData);
    }
  };

  const handleEdit = (blog: Blog) => {
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      author: blog.author,
      image_url: blog.image_url,
      published: blog.published,
      featured: blog.featured,
      tags: blog.tags || [],
      meta_description: blog.meta_description || '',
      slug: blog.slug || ''
    });
    setEditingId(blog.id);
    setIsFormOpen(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const generateSlug = () => {
    if (formData.title) {
      const slug = formData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-[#0B0F1A]">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px] bg-white/5" />
          <div className="flex gap-4">
            <Skeleton className="w-[200px] h-[40px] bg-white/5" />
            <Skeleton className="w-[150px] h-[40px] bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[300px] rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const rawBlogsData = blogsData || [];
  const blogs: Blog[] = Array.isArray(rawBlogsData)
    ? rawBlogsData
    : (rawBlogsData?.blogs || []);

  const total = blogs.length;
  const total_published = blogs.filter(b => b.published !== false).length;
  const total_drafts = blogs.filter(b => b.published === false).length;



  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-[#0B0F1A]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-[#0EA5E9]" />
              Blog Management
            </h1>
            <p className="text-gray-400 mt-1">Industrial Content Engine • Centralized Publishing</p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white h-11 px-6 rounded-xl shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Post
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Posts', value: total, icon: FileText, color: 'text-[#0EA5E9]' },
            { label: 'Published', value: total_published, icon: Globe, color: 'text-[#22C55E]' },
            { label: 'Drafts', value: total_drafts, icon: Clock, color: 'text-[#F59E0B]' },
            { label: 'Total Views', value: blogs.reduce((sum: number, b: Blog) => sum + (b.views || 0), 0).toLocaleString(), icon: TrendingUp, color: 'text-[#8B5CF6]' }
          ].map((stat, i) => (
            <Card key={i} className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0B0F1A] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-gray-900 dark:text-white outline-none focus:border-[#0EA5E9] transition-all"
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-gray-50 dark:bg-[#0B0F1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] bg-gray-50 dark:bg-[#0B0F1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                    <SelectItem value="created_at">Recently Created</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                    <SelectItem value="title">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {blogs.map((blog) => (
              <motion.div
                key={blog.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white dark:bg-[#161B2B] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden hover:border-[#0EA5E9]/50 transition-all duration-300 shadow-xl flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  {blog.image_url ? (
                    <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center">
                      <FileText className="w-12 h-12 text-white/10" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className={blog.published ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/20' : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/20'}>
                      {blog.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-black/50 backdrop-blur-md border-white/10 text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                        <DropdownMenuItem onClick={() => handleEdit(blog)} className="hover:bg-white/5 cursor-pointer">
                          <Edit2 className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteBlogMutation.mutate(blog.id)} className="hover:bg-red-500/10 text-red-400 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">{blog.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-1">{blog.excerpt}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center text-[10px] font-bold text-[#0EA5E9]">
                        {blog.author.charAt(0)}
                      </div>
                      <span className="text-xs text-gray-500">{blog.author}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {blog.views}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(blog.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {blogs.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-[#161B2B] rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
            <BookOpen className="w-16 h-16 text-white/5 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No articles found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">Try adjusting your filters or create a new industrial blog post.</p>
          </div>
        )}

        {/* Editor Overlay */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-white/10 dark:bg-[#0B0F1A]/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#161B2B] w-full max-w-5xl h-full max-h-[90vh] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9]">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Article' : 'Compose New Article'}</h2>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-0.5">Industrial Content Editor</p>
                    </div>
                  </div>
                  <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-4">
                        <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Article Details</Label>
                        <Input 
                          placeholder="Headline (e.g. The Future of AI in Anemia Detection)" 
                          className="bg-gray-50 dark:bg-[#0B0F1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white h-14 text-lg font-bold rounded-2xl focus:ring-[#0EA5E9] focus:border-[#0EA5E9]"
                          value={formData.title}
                          onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                        <Textarea 
                          placeholder="Write your insightful medical narrative here... (Markdown supported)" 
                          className="bg-gray-50 dark:bg-[#0B0F1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white min-h-[400px] rounded-2xl p-6 resize-none focus:ring-[#0EA5E9] focus:border-[#0EA5E9]"
                          value={formData.content}
                          onChange={e => setFormData({...formData, content: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-gray-50 dark:bg-[#0B0F1A] p-6 rounded-3xl border border-gray-200 dark:border-white/5 space-y-6">
                        <div className="space-y-2">
                          <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Cover Media</Label>
                          <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20 aspect-video flex items-center justify-center">
                            {formData.image_url ? (
                              <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-10 h-10 text-white/5" />
                            )}
                          </div>
                          <Input 
                            placeholder="Image URL" 
                            className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/10 text-xs h-10 rounded-xl"
                            value={formData.image_url}
                            onChange={e => setFormData({...formData, image_url: e.target.value})}
                          />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-gray-900 dark:text-white font-bold text-sm">Publish Now</Label>
                              <p className="text-[10px] text-gray-500">Make live instantly</p>
                            </div>
                            <Switch 
                              checked={formData.published}
                              onCheckedChange={checked => setFormData({...formData, published: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-gray-900 dark:text-white font-bold text-sm">Featured</Label>
                              <p className="text-[10px] text-gray-500">Highlight in trends</p>
                            </div>
                            <Switch 
                              checked={formData.featured}
                              onCheckedChange={checked => setFormData({...formData, featured: checked})}
                            />
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Metadata</Label>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-gray-500">Author</Label>
                            <Input 
                              className="bg-[#161B2B] border-white/10 h-9 rounded-lg text-sm"
                              value={formData.author}
                              onChange={e => setFormData({...formData, author: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <Label className="text-[10px] text-gray-500">URL Slug</Label>
                              <button onClick={generateSlug} className="text-[10px] text-[#0EA5E9] hover:underline">Auto-Gen</button>
                            </div>
                            <Input 
                              className="bg-[#161B2B] border-white/10 h-9 rounded-lg text-sm"
                              value={formData.slug}
                              onChange={e => setFormData({...formData, slug: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#0EA5E9]/5 border border-[#0EA5E9]/10 p-6 rounded-3xl">
                        <p className="text-[#0EA5E9] text-xs font-medium leading-relaxed">
                          Industrial Note: All content is indexed for global SEO and clinical transparency. Ensure markdown consistency for best visualization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-[#0B0F1A]/50 flex justify-end gap-4">
                  <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white">Discard</Button>
                  <Button 
                    onClick={handleSave} 
                    className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white h-12 px-8 rounded-2xl font-bold shadow-xl shadow-blue-500/20"
                    disabled={createBlogMutation.isPending || updateBlogMutation.isPending}
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {editingId ? 'Finalize Update' : 'Publish Article'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}