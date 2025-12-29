"use client";

import SocietricsAssessment from '@/components/SocietricsAssessment';

export default function AssessmentPage() {
  return (
    <main className="min-h-screen p-4 bg-slate-50 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Societrics Field Assessment</h1>
          <p className="text-slate-600">Quantitative measurement of Weight Shift Index (WSI) and TPC Modifiers</p>
        </div>
        <SocietricsAssessment />
      </div>
    </main>
  );
}