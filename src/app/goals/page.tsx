"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GoalForm } from "@/components/goals/GoalForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

import { Edit3, MoreHorizontal } from "lucide-react";

import { PlusCircle, Target, Terminal } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useGoals } from "@/contexts/GoalContext"; // We assume you have created this context
import type { Goal } from "@/lib/types";
import Loading from "@/app/loading";

export default function GoalsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const {
    goals,
    loading: goalsLoading,
    error: goalsError,
    updateGoal,
    deleteGoal,
  } = useGoals();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);
  const activeGoals = goals.filter(
    (goal) => !goal.archived && goal.status !== "expired"
  );
  const achievedGoals = goals.filter(
    (goal) => goal.archived && goal.status === "completed"
  );
  const expiredGoals = goals.filter(
    (goal) => goal.status === "expired" && !goal.archived
  );

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || goalsLoading || !currentUser) {
    return <Loading />;
  }
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (goalToDelete) {
      await deleteGoal(goalToDelete.id);
      setGoalToDelete(null);
    }
  };

  const renderGoalCard = (goal: Goal) => {
    const progress = Math.min(
      100,
      Math.round((goal.currentAmount / goal.targetAmount) * 100)
    );

    return (
      <Card
        key={goal.id}
        className={`shadow-md min-w-[350px] max-w-xs ${
          goal.status === "expired" ? "bg-red-100 border border-red-400" : ""
        }`}
      >
        <CardHeader className="flex justify-between">
          <div>
            <CardTitle>{goal.title}</CardTitle>
            <CardDescription>
              Target: ${goal.targetAmount.toLocaleString()}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                <Edit3 className="mr-1 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateGoal(goal.id, { archived: !goal.archived })
                }
              >
                {goal.archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setGoalToDelete(goal)}
                className="text-destructive"
              >
                🗑 Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Saved: ${goal.currentAmount.toLocaleString()}
          </div>
          <Progress value={progress} />
          <div className="text-xs text-right text-muted-foreground">
            {progress}% achieved
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" /> Financial Goals
        </h1>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 mt-2">
            <label className="text-sm font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={showArchivedGoals}
                onChange={(e) => setShowArchivedGoals(e.target.checked)}
                className="mr-2"
              />
              Show Archived Goals
            </label>
          </div>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingGoal(null);
                  setIsFormOpen(true);
                }}
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                <PlusCircle className="mr-2 h-5 max-w-4" /> Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? "Edit Goal" : "Add New Goal"}
                </DialogTitle>
              </DialogHeader>
              <GoalForm
                initialData={editingGoal}
                onSuccess={() => {
                  setIsFormOpen(false);
                  setEditingGoal(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {goalsError && (
        <Alert variant="destructive" className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Storage Error</AlertTitle>
          <AlertDescription>{goalsError}</AlertDescription>
        </Alert>
      )}

      {goals.length === 0 && !goalsError && (
        <Card className="text-center py-10 shadow-sm">
          <CardHeader>
            <CardTitle>No Goals Yet</CardTitle>
            <CardDescription>
              Start saving by setting your first financial goal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {goals.length > 0 && (
        <div className="space-y-6">
          {/* Active Goals Section */}
          {activeGoals.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-foreground">
                Active Goals
              </h2>
              <div className="flex flex-wrap gap-4 max-w-full">
                {activeGoals.map((goal) => renderGoalCard(goal))}
              </div>
            </>
          )}

          {/* Archived Goals Section */}
          {showArchivedGoals && achievedGoals.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-green-700 mt-6">
                🎯 Goals Achieved
              </h2>
              <div className="flex flex-wrap gap-4 max-w-full">
                {achievedGoals.map((goal) => renderGoalCard(goal))}
              </div>
            </>
          )}

          {/* Missed Goals Section */}
          {showArchivedGoals && expiredGoals.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-red-700 mt-6">
                ⏳ Missed Goals
              </h2>
              <div className="flex flex-wrap gap-4 max-w-full">
                {expiredGoals.map((goal) => renderGoalCard(goal))}
              </div>
            </>
          )}
        </div>
      )}
      {goalToDelete && (
        <AlertDialog
          open={!!goalToDelete}
          onOpenChange={() => setGoalToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the goal "{goalToDelete.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setGoalToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteGoal}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
