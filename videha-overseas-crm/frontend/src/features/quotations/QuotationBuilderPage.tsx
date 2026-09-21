import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { QuotationBuilder } from '@videha/quotation-builder/QuotationBuilder';
import type { QuotationData } from '@videha/quotation-builder/types';
import {
  clearBuilderPayload,
  readBuilderPayload,
  type BuilderQuotationData
} from '../../lib/crmToBuilderQuotation';
import '@videha/quotation-builder/styles/quotation-builder.css';

type QuotationBuilderPageProps = {
  initialPayload?: BuilderQuotationData | null;
  onBack: () => void;
};

function toBuilderData(payload: BuilderQuotationData): QuotationData {
  return payload as QuotationData;
}

export const QuotationBuilderPage: React.FC<QuotationBuilderPageProps> = ({
  initialPayload,
  onBack
}) => {
  const [data, setData] = useState<QuotationData | null>(null);

  useEffect(() => {
    const payload = initialPayload ?? readBuilderPayload();
    if (payload) {
      setData(toBuilderData(payload));
      clearBuilderPayload();
    }
  }, [initialPayload]);

  return (
    <div className="min-h-full bg-[#F6F4EE]">
      <div className="sticky top-0 z-20 border-b border-[#E2DED2] bg-[#F6F4EE]/95 backdrop-blur-sm px-4 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#483226] hover:text-[#1F2421] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotations
        </button>
      </div>
      {data ? (
        <QuotationBuilder initialData={data} logoSrc="/quotation-logo.png" />
      ) : (
        <div className="p-10 text-center text-sm text-[#665E52]">Loading quotation builder…</div>
      )}
    </div>
  );
};
