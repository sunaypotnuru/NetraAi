import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { FileText, Calendar, User } from 'lucide-react';
import PageWrapper from "@/components/ui/PageWrapper";

interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  image_url: string;
  created_at: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ background: "rgba(13,148,136,0.18)", color: "#5eead4" }}
          >
            Netra AI Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Latest Insights &amp; Research
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Stay updated with the latest advancements in AI-driven healthcare, telemedicine, and our platform updates.
          </p>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-[#0D9488] border-t-transparent animate-spin" />
          </div>
        ) : blogs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, idx) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all group"
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
              >
                {blog.image_url ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={blog.image_url}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-[#0D9488]/20 to-[#0EA5E9]/20 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-[#0D9488]/40" />
                  </div>
                )}

                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-3 line-clamp-2">
                    {blog.title}
                  </h2>
                  <p className="text-slate-400 line-clamp-3 mb-6">
                    {blog.content}
                  </p>

                  <div className="flex items-center justify-between text-sm text-slate-400 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#0D9488]" />
                      <span className="font-medium text-slate-300">{blog.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0EA5E9]" />
                      <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 rounded-2xl p-16 border border-white/10 text-center"
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">No Articles Yet</h2>
            <p className="text-slate-400 text-lg">Check back soon for our first publication!</p>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
