import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";
import { pad2 } from "../utils/format";

type MonthYearState = {
  year: number;
  month: number;
  setYear: Dispatch<SetStateAction<number>>;
  setMonth: Dispatch<SetStateAction<number>>;
  periodLabel: string;
  syncQueryParams: (nextYear: number, nextMonth: number) => void;
};

export function useMonthYearQuery(): MonthYearState {
  const now = useMemo(() => new Date(), []);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialYear = Number(searchParams.get("year")) || now.getFullYear();
  const initialMonth = Number(searchParams.get("month")) || now.getMonth() + 1;

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const periodLabel = `${pad2(month)}/${year}`;

  const syncQueryParams = useCallback(
    (nextYear: number, nextMonth: number) => {
      const nextYearStr = String(nextYear);
      const nextMonthStr = String(nextMonth);

      setSearchParams(
        (current) => {
          if (current.get("year") === nextYearStr && current.get("month") === nextMonthStr) {
            return current;
          }

          const next = new URLSearchParams(current);
          next.set("year", nextYearStr);
          next.set("month", nextMonthStr);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return {
    year,
    month,
    setYear,
    setMonth,
    periodLabel,
    syncQueryParams,
  };
}
