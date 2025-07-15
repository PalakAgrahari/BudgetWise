"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useGoals } from "@/contexts/GoalContext";
import type { Goal } from "@/lib/types";

const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  currentAmount: z.coerce.number().min(0, "Current amount must be at least 0"),
  deadline: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  initialData?: Goal | null;
  onSuccess?: () => void;
}

export function GoalForm({ initialData, onSuccess }: GoalFormProps) {
  const { addGoal, updateGoal } = useGoals();
  const isEditMode = !!initialData;

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: initialData?.title || "",
      targetAmount: initialData?.targetAmount || 0,
      currentAmount: initialData?.currentAmount || 0,
      deadline: initialData?.deadline || "",
    },
  });

  const onSubmit = async (data: GoalFormData) => {
    if (isEditMode && initialData?.id) {
      await updateGoal(initialData.id, data);
    } else {
      await addGoal(data);
    }
    form.reset();
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...form.register("title")}
          placeholder="e.g., Buy a laptop"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* Target Amount */}
      <div className="space-y-1">
        <Label htmlFor="targetAmount">Target Amount ($)</Label>
        <Input
          id="targetAmount"
          type="number"
          step="0.01"
          {...form.register("targetAmount")}
          placeholder="1000"
        />
        {form.formState.errors.targetAmount && (
          <p className="text-sm text-destructive">
            {form.formState.errors.targetAmount.message}
          </p>
        )}
      </div>

      {/* Current Amount */}
      <div className="space-y-1">
        <Label htmlFor="currentAmount">Current Savings ($)</Label>
        <Input
          id="currentAmount"
          type="number"
          step="0.01"
          {...form.register("currentAmount")}
          placeholder="0"
        />
        {form.formState.errors.currentAmount && (
          <p className="text-sm text-destructive">
            {form.formState.errors.currentAmount.message}
          </p>
        )}
      </div>

      {/* Deadline (Optional) */}
      <div className="space-y-1">
        <Label htmlFor="deadline">Deadline (YYYY-MM-DD)</Label>
        <Input id="deadline" type="date" {...form.register("deadline")} />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isEditMode ? "Update Goal" : "Add Goal"}
      </Button>
    </form>
  );
}
