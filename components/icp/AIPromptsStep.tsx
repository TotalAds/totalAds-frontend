import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconBrain, IconTarget } from '@tabler/icons-react';
import { StepProps } from './types';

export default function AIPromptsStep({
  formData,
  setFormData,
}: StepProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Label
            htmlFor="businessModel"
            className="text-gray-900 font-bold text-base flex items-center space-x-2"
          >
            <IconBrain className="w-5 h-5 text-purple-600" />
            <span>Business Model Analysis</span>
          </Label>
          <Textarea
            id="businessModel"
            value={formData.customPrompts?.businessModel || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData({
                ...formData,
                customPrompts: {
                  ...formData.customPrompts,
                  businessModel: e.target.value,
                },
              })
            }
            rows={4}
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 text-base transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm resize-none"
            placeholder="Describe what business model you're looking for..."
          />
        </div>

        <div className="space-y-4">
          <Label
            htmlFor="targetMarket"
            className="text-gray-900 font-bold text-base flex items-center space-x-2"
          >
            <IconTarget className="w-5 h-5 text-pink-600" />
            <span>Target Market Analysis</span>
          </Label>
          <Textarea
            id="targetMarket"
            value={formData.customPrompts?.targetMarket || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData({
                ...formData,
                customPrompts: {
                  ...formData.customPrompts,
                  targetMarket: e.target.value,
                },
              })
            }
            rows={4}
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 text-base transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm resize-none"
            placeholder="Describe the target market you're interested in..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Label
            htmlFor="companySize"
            className="text-gray-900 font-bold text-base flex items-center space-x-2"
          >
            <IconTarget className="w-5 h-5 text-blue-600" />
            <span>Company Size Criteria</span>
          </Label>
          <Textarea
            id="companySize"
            value={formData.customPrompts?.companySize || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData({
                ...formData,
                customPrompts: {
                  ...formData.customPrompts,
                  companySize: e.target.value,
                },
              })
            }
            rows={4}
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 text-base transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm resize-none"
            placeholder="Specify ideal company size range..."
          />
        </div>

        <div className="space-y-4">
          <Label
            htmlFor="technology"
            className="text-gray-900 font-bold text-base flex items-center space-x-2"
          >
            <IconBrain className="w-5 h-5 text-green-600" />
            <span>Technology Stack</span>
          </Label>
          <Textarea
            id="technology"
            value={formData.customPrompts?.technology || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData({
                ...formData,
                customPrompts: {
                  ...formData.customPrompts,
                  technology: e.target.value,
                },
              })
            }
            rows={4}
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 text-base transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm resize-none"
            placeholder="Technologies or tools they should use..."
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label
          htmlFor="userRemarks"
          className="text-gray-900 font-bold text-base flex items-center space-x-2"
        >
          <IconBrain className="w-5 h-5 text-yellow-600" />
          <span>Additional Remarks</span>
        </Label>
        <Textarea
          id="userRemarks"
          value={formData.customPrompts?.userRemarks || ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData({
              ...formData,
              customPrompts: {
                ...formData.customPrompts,
                userRemarks: e.target.value,
              },
            })
          }
          rows={5}
          className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 text-base transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm resize-none"
          placeholder="Any additional context or specific requirements for your ideal customer..."
        />
      </div>
    </div>
  );
}
