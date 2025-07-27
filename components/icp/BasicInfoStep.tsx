import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StepProps } from './types';

export default function BasicInfoStep({
  formData,
  setFormData,
  validationErrors,
  validationStarted,
}: StepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label
          htmlFor="name"
          className="text-gray-900 font-bold text-base flex items-center space-x-2"
        >
          <span>Profile Name</span>
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className={cn(
            "bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg h-14 px-4 text-base transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm",
            validationStarted &&
              validationErrors.name?.length > 0 &&
              "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-200"
          )}
          placeholder="e.g., SaaS Startups 50-200 employees"
        />
        {validationStarted && validationErrors.name?.length > 0 && (
          <p className="text-red-500 text-sm flex items-center space-x-1">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            <span>{validationErrors.name[0]}</span>
          </p>
        )}
      </div>

      <div className="space-y-4">
        <Label
          htmlFor="description"
          className="text-gray-900 font-bold text-base"
        >
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 text-base transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm resize-none"
          placeholder="Describe your ideal customer profile..."
        />
      </div>
    </div>
  );
}
