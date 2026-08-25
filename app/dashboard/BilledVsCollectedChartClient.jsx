"use client";

import dynamic from "next/dynamic";

const BilledVsCollectedChart = dynamic(() => import("./BilledVsCollectedChart"), {
  ssr: false,
});

export default function BilledVsCollectedChartClient(props) {
  return <BilledVsCollectedChart {...props} />;
}