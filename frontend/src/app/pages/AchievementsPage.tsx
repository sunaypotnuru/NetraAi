import React from 'react';

import { motion } from "motion/react";
import { Trophy, Star, TrendingUp, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import api from "../../lib/api";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Share2, Loader2 } from "lucide-react";
import BadgeDisplay from "@/components/features/domain/BadgeDisplay";
import ChallengeCard from "@/components/features/domain/ChallengeCard";
import { useTranslation } from "../../lib/i18n";
import { useAuthStore } from "../../lib/store";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  points_reward: number;
  earned?: boolean;
  earned_at?: string;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  target_value: number;
  reward_points: number;
  start_date: string;
  end_date: string;
  current_progress?: number;
  completed?: boolean;
  completed_at?: string;
}



export default function AchievementsPage() {
  const { user: _user } = useAuthStore();
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [badges, setBadges] = React.useState<Badge[]>([]);
  const [challenges, setChallenges] = React.useState<Challenge[]>([]);
  const [userPoints, setUserPoints] = React.useState(0);
  const [userLevel, setUserLevel] = React.useState(1);
  const [nextLevelPoints, setNextLevelPoints] = React.useState(100);
  const [loading, setLoading] = React.useState(true);
  const [sharingAchievement, setSharingAchievement] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { t } = useTranslation();

  const DEFAULT_ACHIEVEMENTS: Achievement[] = [
    {
      id: "ach-1",
      name: "Health Pioneer",
      description: "Completed your first AI eye scan for health screening.",
      icon: "🔬",
      points: 100,
      unlocked: true,
    },
    {
      id: "ach-2",
      name: "Vision Guardian",
      description: "Completed an ocular cataract screening assessment.",
      icon: "👁️",
      points: 150,
      unlocked: true,
    },
    {
      id: "ach-3",
      name: "Telehealth Explorer",
      description: "Booked and completed a live video consultation with a doctor.",
      icon: "🎥",
      points: 200,
      unlocked: false,
    },
    {
      id: "ach-4",
      name: "Consistency Master",
      description: "Maintained a 7-day continuous health check-in streak.",
      icon: "🔥",
      points: 250,
      unlocked: false,
    },
    {
      id: "ach-5",
      name: "Wellness Advocate",
      description: "Completed a comprehensive mental health & voice analysis test.",
      icon: "❤️",
      points: 150,
      unlocked: true,
    },
    {
      id: "ach-6",
      name: "Early Bird",
      description: "Scheduled a morning specialist consultation.",
      icon: "🌅",
      points: 100,
      unlocked: false,
    },
  ];

  const DEFAULT_BADGES: Badge[] = [
    {
      id: "bdg-1",
      name: "Pioneer Badge",
      description: "Awarded for early adoption of AI preventive health tools.",
      icon: "🏆",
      category: "scanning",
      rarity: "rare",
      points_reward: 100,
      earned: true,
      earned_at: new Date().toISOString(),
    },
    {
      id: "bdg-2",
      name: "Prevention Champion",
      description: "Awarded for proactive clinical check-ups and regular scans.",
      icon: "🛡️",
      category: "clinical",
      rarity: "epic",
      points_reward: 200,
      earned: true,
      earned_at: new Date().toISOString(),
    },
    {
      id: "bdg-3",
      name: "Voice Wellness Master",
      description: "Unlocked after completing acoustic mental health screening.",
      icon: "🎙️",
      category: "mental_health",
      rarity: "legendary",
      points_reward: 300,
      earned: false,
    },
    {
      id: "bdg-4",
      name: "Family Guardian",
      description: "Added and managed dependent family members in Netra AI.",
      icon: "👨‍👩‍👧",
      category: "family",
      rarity: "common",
      points_reward: 50,
      earned: true,
      earned_at: new Date().toISOString(),
    },
  ];

  const DEFAULT_CHALLENGES: Challenge[] = [
    {
      id: "ch-1",
      name: "7-Day Health Tracking Streak",
      description: "Perform at least one health check or log daily for 7 days in a row.",
      type: "daily_checkin",
      category: "consistency",
      target_value: 7,
      reward_points: 300,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      current_progress: 3,
      completed: false,
    },
    {
      id: "ch-2",
      name: "Complete Health Profile",
      description: "Fill in all emergency contacts, medical history, and allergies.",
      type: "profile_completion",
      category: "setup",
      target_value: 1,
      reward_points: 100,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      current_progress: 1,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    {
      id: "ch-3",
      name: "Monthly AI Vision Scan",
      description: "Run an updated anemia or cataract screening scan this month.",
      type: "ai_scan",
      category: "screening",
      target_value: 1,
      reward_points: 250,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      current_progress: 1,
      completed: true,
      completed_at: new Date().toISOString(),
    },
  ];

  const loadData = React.useCallback(async () => {
    try {
      const [achievementsRes, badgesRes, challengesRes] = await Promise.all([
        api.get("/api/v1/gamification/achievements").catch(() => ({ data: null })),
        api.get("/api/v1/gamification/badges").catch(() => ({ data: null })),
        api.get("/api/v1/gamification/challenges").catch(() => ({ data: null })),
      ]);

      const fetchedAchievements = Array.isArray(achievementsRes?.data?.achievements) && achievementsRes.data.achievements.length > 0 
        ? achievementsRes.data.achievements 
        : DEFAULT_ACHIEVEMENTS;
        
      const fetchedBadges = Array.isArray(badgesRes?.data) && badgesRes.data.length > 0 
        ? badgesRes.data 
        : DEFAULT_BADGES;
        
      const fetchedChallenges = Array.isArray(challengesRes?.data) && challengesRes.data.length > 0 
        ? challengesRes.data 
        : DEFAULT_CHALLENGES;

      const calcUnlocked = fetchedAchievements.filter((a: Achievement) => a.unlocked).length;
      const calcPoints = achievementsRes?.data?.points || calcUnlocked * 100 + 150;

      setAchievements(fetchedAchievements);
      setUserPoints(calcPoints);
      setUserLevel(achievementsRes?.data?.level || Math.floor(calcPoints / 100) + 1);
      setNextLevelPoints(achievementsRes?.data?.next_level_points || 100);
      setBadges(fetchedBadges);
      setChallenges(fetchedChallenges);
    } catch (error) {
      console.error("Error loading achievements:", error);
      setAchievements(DEFAULT_ACHIEVEMENTS);
      setBadges(DEFAULT_BADGES);
      setChallenges(DEFAULT_CHALLENGES);
      setUserPoints(350);
      setUserLevel(4);
      setNextLevelPoints(100);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShare = async (achievement: Achievement) => {
    setSharingAchievement(achievement.id);

    try {
      const element = document.getElementById(`achievement-card-${achievement.id}`);
      if (!element) throw new Error("Card element not found");

      // Generate Canvas handling CORS
      const canvas = await html2canvas(element, {
        scale: 2, // higher resolution
        useCORS: true, // handle cross-origin images like avatars
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imageURL = canvas.toDataURL("image/png");
      const fileName = `netra-achievement-${achievement.name.replace(/\s+/g, '-').toLowerCase()}.png`;

      // If Web Share API is available (native mobile sharing)
      if (navigator.share) {
        try {
          // Convert dataUrl to File object for native sharing
          const res = await fetch(imageURL);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: "image/png" });

          await navigator.share({
            title: t('patient.achievements.share_title', { defaultValue: "I unlocked {{name}} on Netra AI!", name: achievement.name }),
            text: t('patient.achievements.share_text', { defaultValue: "Check out my new health achievement: {{description}}", description: achievement.description }),
            files: [file]
          });
          toast.success(t('patient.achievements.share_success', "Achievement shared successfully!"));
        } catch (shareError) {
          if (shareError instanceof Error && shareError.name !== 'AbortError') {
            // Fallback to download if web share fails unexpectedly
            triggerDownload(imageURL, fileName);
          }
        }
      } else {
        // Fallback for Desktop: direct download
        triggerDownload(imageURL, fileName);
      }
    } catch (error) {
      console.error("Error generating share image:", error);
      toast.error(t('patient.achievements.share_error', "Failed to generate shareable image."));
    } finally {
      setSharingAchievement(null);
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    toast.success(t('patient.achievements.download_success', "Achievement image downloaded!"));
  };

  const handleStartChallenge = async (challengeId: string) => {
    try {
      await api.post(`/api/v1/gamification/challenges/${challengeId}/start`);
      toast.success(t('patient.achievements.challenge_started', "Challenge started! Good luck!"));
      loadData();
    } catch (error) {
      console.error("Error starting challenge:", error);
      toast.error(t('patient.achievements.challenge_error', "Failed to start challenge"));
    }
  };

  const progressToNextLevel = ((userPoints % 100) / 100) * 100;
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  if (loading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-gradient-to-br from-[#F0FDFA] via-white to-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]">{t('patient.achievements.loading', "Loading achievements...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-gradient-to-br from-[#F0FDFA] via-white to-[#F8FAFC]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-[#0F172A]">{t('patient.achievements.title', "Achievements")}</h1>
            <div className="relative w-full md:w-72">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder={t("common.search", "Search...")}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-[#0D9488] transition-all bg-white shadow-sm text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0D9488] to-[#0F766E] rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">{t('patient.achievements.level', "Level")}</p>
                  <p className="text-2xl font-bold text-[#0F172A]">{userLevel}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">{t('patient.achievements.points', "Points")}</p>
                  <p className="text-2xl font-bold text-[#0F172A]">{userPoints}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">{t('patient.achievements.unlocked', "Unlocked")}</p>
                  <p className="text-2xl font-bold text-[#0F172A]">
                    {unlockedCount}/{achievements.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">{t('patient.achievements.next_level', "Next Level")}</p>
                  <p className="text-2xl font-bold text-[#0F172A]">{nextLevelPoints}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Progress to Next Level */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-[#0F172A]">{t('patient.achievements.progress_level', { defaultValue: "Progress to Level {{level}}", level: userLevel + 1 })}</p>
              <p className="text-sm text-[#64748B]">{t('patient.achievements.points_ratio', { defaultValue: "{{current}}/{{total}} points", current: userPoints % 100, total: nextLevelPoints })}</p>
            </div>
            <Progress value={progressToNextLevel} className="h-3" />
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="achievements" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="achievements">{t('patient.achievements.tab_achievements', "Achievements")}</TabsTrigger>
              <TabsTrigger value="badges">{t('patient.achievements.tab_badges', "Badges")}</TabsTrigger>
              <TabsTrigger value="challenges">{t('patient.achievements.tab_challenges', "Challenges")}</TabsTrigger>
            </TabsList>

            <TabsContent value="achievements">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements
                  .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      id={`achievement-card-${achievement.id}`}
                      className={`p-6 transition-all ${achievement.unlocked
                        ? "border-2 border-[#0D9488] bg-white shadow-sm"
                        : "opacity-60 grayscale bg-gray-50"
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-6xl mb-4">{achievement.icon}</div>
                        <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-[#64748B] mb-4">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="font-semibold text-[#0F172A]">
                            {t('patient.achievements.points_value', { defaultValue: "{{points}} points", points: achievement.points })}
                          </span>
                        </div>
                        {achievement.unlocked && (
                          <div className="mt-4 flex flex-col items-center gap-2">
                            <span className="inline-block px-3 py-1 bg-[#0D9488] text-white text-sm rounded-full">
                              ✓ {t('patient.achievements.is_unlocked', "Unlocked")}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/10"
                              onClick={() => handleShare(achievement)}
                              disabled={sharingAchievement === achievement.id}
                            >
                              {sharingAchievement === achievement.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Share2 className="w-4 h-4 mr-2" />
                              )}
                              {sharingAchievement === achievement.id ? t('common.generating', "Generating...") : t('common.share', "Share")}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="badges">
              <BadgeDisplay badges={badges} />
            </TabsContent>

            <TabsContent value="challenges">
              <ChallengeCard challenges={challenges} onStartChallenge={handleStartChallenge} />
            </TabsContent>


          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
