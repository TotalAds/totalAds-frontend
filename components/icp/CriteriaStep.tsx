import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconSettings, IconTrash } from "@tabler/icons-react";

import { CATEGORY_OPTIONS, OPERATOR_OPTIONS } from "./constants";
import { StepProps } from "./types";

export default function CriteriaStep({
  criteria = [],
  addCriterion,
  removeCriterion,
  updateCriterion,
}: StepProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Scoring Criteria</h3>
          <p className="text-gray-600 text-sm mt-1">
            Define specific criteria for evaluating leads
          </p>
        </div>
        <Button
          type="button"
          onClick={addCriterion}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 flex items-center space-x-2"
        >
          <IconPlus className="w-4 h-4" />
          <span>Add Criterion</span>
        </Button>
      </div>

      {criteria.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <IconSettings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>
            No criteria defined yet. Click &quot;Add Criterion&quot; to get
            started.
          </p>
        </div>
      )}

      {criteria.map((criterion, index) => (
        <Card
          key={index}
          className="bg-white border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 text-lg font-bold flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {index + 1}
                  </span>
                </div>
                <span>Criterion {index + 1}</span>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCriterion?.(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <IconTrash className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">
                  Category
                </Label>
                <Select
                  value={criterion.category}
                  onValueChange={(value) =>
                    updateCriterion?.(index, "category", value)
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 rounded-lg h-12 text-sm transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 rounded-lg shadow-xl">
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-gray-900 hover:bg-purple-50 focus:bg-purple-100 rounded-md m-1 transition-all duration-200"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">
                  Field
                </Label>
                <Input
                  type="text"
                  value={criterion.field}
                  onChange={(e) =>
                    updateCriterion?.(index, "field", e.target.value)
                  }
                  className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg h-12 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm placeholder:text-gray-500"
                  placeholder="e.g., employee_count"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">
                  Operator
                </Label>
                <Select
                  value={criterion.operator}
                  onValueChange={(value) =>
                    updateCriterion?.(index, "operator", value)
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 rounded-lg h-12 text-sm transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 rounded-lg shadow-xl">
                    {OPERATOR_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-gray-900 hover:bg-purple-50 focus:bg-purple-100 rounded-md m-1 transition-all duration-200"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">
                  Value
                </Label>
                <Input
                  type="text"
                  value={criterion.value}
                  onChange={(e) =>
                    updateCriterion?.(index, "value", e.target.value)
                  }
                  className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg h-12 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm placeholder:text-gray-500"
                  placeholder="Expected value"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">
                  Weight
                </Label>
                <Input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={criterion.weight}
                  onChange={(e) =>
                    updateCriterion?.(
                      index,
                      "weight",
                      parseFloat(e.target.value)
                    )
                  }
                  className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg h-12 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm placeholder:text-gray-500"
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">
                  Match Score
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={criterion.scoreIfMatch}
                  onChange={(e) =>
                    updateCriterion?.(
                      index,
                      "scoreIfMatch",
                      parseInt(e.target.value)
                    )
                  }
                  className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg h-12 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm placeholder:text-gray-500"
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">
                  No Match Score
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={criterion.scoreIfNoMatch}
                  onChange={(e) =>
                    updateCriterion?.(
                      index,
                      "scoreIfNoMatch",
                      parseInt(e.target.value)
                    )
                  }
                  className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg h-12 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm placeholder:text-gray-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`required-${index}`}
                    checked={criterion.isRequired}
                    onChange={(e) =>
                      updateCriterion?.(index, "isRequired", e.target.checked)
                    }
                    className="w-5 h-5 rounded border-gray-300 bg-white text-purple-500 focus:ring-purple-500 focus:ring-2 transition-all duration-200"
                  />
                  <Label
                    htmlFor={`required-${index}`}
                    className="text-gray-700 font-semibold text-sm cursor-pointer"
                  >
                    Required criterion
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">
                  Description (Optional)
                </Label>
                <Input
                  type="text"
                  value={criterion.description}
                  onChange={(e) =>
                    updateCriterion?.(index, "description", e.target.value)
                  }
                  className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg h-12 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-400 shadow-sm placeholder:text-gray-500"
                  placeholder="Describe this criterion..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
