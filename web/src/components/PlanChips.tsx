import type { QueryPlan } from '../features/search/types';

interface PlanChipsProps {
  plan: QueryPlan;
}

export function PlanChips({ plan }: PlanChipsProps) {
  return (
    <div className="my-4">
      <div className="text-sm text-gray-600 mb-2">Searching for:</div>
      <div className="flex flex-wrap gap-2">
        {plan.subQueries.map((subQuery, idx) => (
          <div
            key={idx}
            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
          >
            {subQuery}
          </div>
        ))}
      </div>
    </div>
  );
}

