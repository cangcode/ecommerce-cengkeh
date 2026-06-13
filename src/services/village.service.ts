import { http } from "@/lib/http";

export const getVillages = async (idKecamatan: string) => {
  const response = await http.get(`/villages/${idKecamatan}`);

  return response.data;
};
