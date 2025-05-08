import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const verificationSchema = z.object({
  status: z.enum(["confirmed", "rejected", "flagged"], {
    required_error: "Please select a verification status",
  }),
  comments: z.string().optional(),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

interface VerificationFormProps {
  assessmentId: number;
  onVerificationComplete?: () => void;
}

export function VerificationForm({ assessmentId, onVerificationComplete }: VerificationFormProps) {
  const { toast } = useToast();

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      status: undefined,
      comments: "",
    },
  });

  const verificationMutation = useMutation({
    mutationFn: async (values: VerificationFormValues) => {
      const res = await apiRequest("POST", "/api/verifications", {
        ...values,
        assessmentId,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification submitted",
        description: "Your verification has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/verifications'] });
      form.reset();
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: VerificationFormValues) => {
    verificationMutation.mutate(values);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Verification Decision</CardTitle>
        <CardDescription>
          Review the assessment and provide your verification decision
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Verification Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="confirmed" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Confirm — The assessment meets all standards and criteria
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="flagged" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Flag Issues — The assessment has minor issues that need attention
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="rejected" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Reject — The assessment has significant issues and needs reassessment
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide any comments or feedback on this assessment"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Especially important if flagging issues or rejecting the assessment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={verificationMutation.isPending}
            >
              {verificationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Verification"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
