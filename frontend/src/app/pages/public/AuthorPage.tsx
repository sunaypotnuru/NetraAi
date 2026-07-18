import { motion } from "framer-motion";
import { Linkedin, User } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import PageWrapper from "@/components/ui/PageWrapper";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar_url: string;
  linkedin_url: string;
}

export default function AuthorPage() {
  const { t } = useTranslation();

  const { data: team = [], isLoading } = useQuery({
    queryKey: ["publicTeamMembers"],
    queryFn: async () => {
      const res = await api.get("/api/v1/team");
      return res.data as TeamMember[];
    },
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-24">
          <div className="w-16 h-16 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300"
        >
          Our Team
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          {t("public.author.title", "Meet the Minds Behind NetraAI")}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t(
            "public.author.description",
            "Our platform is built by passionate engineers and medical professionals dedicated to democratizing healthcare. Proudly originating from Universal AI University, Karjat, India."
          )}
        </p>
      </motion.div>

      {/* Team Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {team.length > 0 ? (
          team.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="rounded-3xl p-8 text-center flex flex-col h-full border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md"
            >
              {/* Avatar */}
              <div className="w-24 h-24 mx-auto rounded-full p-[2px] mb-5 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#0D9488,#0EA5E9)" }}>
                <div className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-3xl font-bold text-[#0D9488] overflow-hidden">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{member.name}</h2>
              <p className="text-teal-600 dark:text-teal-400 font-semibold text-sm mb-4">{member.role}</p>
              <p className="text-slate-600 dark:text-slate-450 mb-6 text-sm leading-relaxed flex-grow">{member.bio}</p>

              <div className="flex justify-center gap-4 mt-auto">
                {member.linkedin_url && (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/20 text-slate-500 dark:text-slate-400 hover:bg-[#0A66C2] hover:text-white hover:border-transparent transition-all duration-300"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-3 text-center text-slate-400 py-16 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <User className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-lg">{t("public.author.no_team", "No team members configured yet.")}</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
