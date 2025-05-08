import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import { Loader2, Upload } from "lucide-react";

const submissionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  unitId: z.string().min(1, "Unit is required"),
  taskId: z.string().min(1, "Task is required"),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export function SubmissionForm() {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  
  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: "",
      description: "",
      unitId: "",
      taskId: "",
    },
  });

  // Get units
  const { data: units = [] } = useQuery({
    queryKey: ['/api/units'],
  });

  // Get tasks based on selected unit
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/units', form.watch('unitId'), 'tasks'],
    enabled: !!form.watch('unitId'),
  });

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const validateFiles = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one file for your submission",
        variant: "destructive",
      });
      return false;
    }

    // Check file types and sizes
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'video/mp4', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 20 * 1024 * 1024; // 20MB
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not in an allowed format. Please use PDF, JPG, PNG, MP4, or DOCX files only.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `File "${file.name}" exceeds the 20MB size limit.`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const submitMutation = useMutation({
    mutationFn: async (values: SubmissionFormValues) => {
      if (!validateFiles()) {
        throw new Error("File validation failed");
      }
      
      const formData = new FormData();
      formData.append('submissionData', JSON.stringify({
        ...values,
        unitId: parseInt(values.unitId),
        taskId: parseInt(values.taskId),
      }));
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission successful",
        description: "Your evidence has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      form.reset();
      setFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SubmissionFormValues) => {
    submitMutation.mutate(values);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Evidence</CardTitle>
        <CardDescription>
          Upload your evidence files and provide details for assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a title for your submission" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your submission a clear and descriptive title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit: any) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.code}: {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="taskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!form.watch('unitId')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={form.watch('unitId') ? "Select a task" : "Select a unit first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tasks.map((task: any) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide additional context for your submission" 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Explain what you've included and how it meets the requirements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Upload Files</FormLabel>
              <div className="mt-2">
                <FileUploader
                  onFilesChange={handleFilesChange}
                  acceptedFileTypes="application/pdf,image/jpeg,image/png,video/mp4,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  maxFileSizeMB={20}
                  multiple={true}
                  maxFiles={10}
                />
              </div>
              <FormDescription className="mt-2">
                Accepted formats: PDF, JPG, PNG, MP4, DOCX. Maximum size: 20MB per file.
              </FormDescription>
              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="text-sm text-neutral-600">
                        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Evidence
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
