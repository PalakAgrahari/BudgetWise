"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Goal } from "@/lib/types";
import { isBefore, parseISO } from "date-fns";

interface GoalContextType {
  goals: Goal[];
  addGoal: (
    goalData: Omit<Goal, "id" | "userId" | "createdAt" | "currentAmount">
  ) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoal: (id: string, goalData: Partial<Goal>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "goals"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const updatedGoals: Goal[] = [];

        for (const document of snapshot.docs) {
          const goal = { id: document.id, ...document.data() } as Goal;

          const deadline = parseISO(goal.deadline);
          const now = new Date();

          const isAchieved = goal.currentAmount >= goal.targetAmount;
          const isExpired = isBefore(deadline, now);

          let newStatus: Goal["status"] = "in-progress";
          let shouldArchive = false;

          if (isAchieved && isExpired) {
            newStatus = "completed";
            shouldArchive = true;
          } else if (!isAchieved && isExpired) {
            newStatus = "expired";
          } else if (isAchieved && !isExpired) {
            newStatus = "completed";
          }

          const goalNeedsUpdate =
            goal.status !== newStatus || goal.archived !== shouldArchive;

          if (goalNeedsUpdate) {
            try {
              await updateDoc(doc(db, "goals", goal.id), {
                status: newStatus,
                archived: shouldArchive,
              });

              if (shouldArchive) {
                toast({
                  title: "🎯 Goal Archived",
                  description: `"${goal.title}" was completed and archived.`,
                  variant: "default",
                });
              }
            } catch (error) {
              console.error(`Error auto-updating goal: ${goal.title}`, error);
            }
          }

          updatedGoals.push({
            ...goal,
            status: newStatus,
            archived: shouldArchive,
          });
        }

        setGoals(updatedGoals);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching goals:", error);
        setError("Could not load goals. Try again later.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, toast]);

  const addGoal = async (
    goalData: Omit<Goal, "id" | "userId" | "createdAt" | "currentAmount">
  ) => {
    if (!currentUser) return;
    const newGoal: Omit<Goal, "id"> = {
      ...goalData,
      userId: currentUser.uid,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, "goals"), newGoal);
    toast({ title: "Goal Added", description: "Your goal has been created." });
  };

  const deleteGoal = async (id: string) => {
    await deleteDoc(doc(db, "goals", id));
    toast({ title: "Goal Deleted" });
  };

  const updateGoal = async (id: string, goalData: Partial<Goal>) => {
    await updateDoc(doc(db, "goals", id), goalData);
    toast({ title: "Goal Updated" });
  };

  return (
    <GoalContext.Provider value={{ goals, addGoal, deleteGoal, updateGoal }}>
      {children}
    </GoalContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (!context) throw new Error("useGoals must be used within a GoalProvider");
  return context;
};
