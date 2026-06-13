"use client";

import { getVillages } from "@/services/village.service";
import { useQuery } from "@tanstack/react-query";

export const useVillages = (idKecamatan: string) => {
  return useQuery({
    queryKey: ["villages", idKecamatan],
    queryFn: () => getVillages(idKecamatan),
    enabled: !!idKecamatan,
  });
};
