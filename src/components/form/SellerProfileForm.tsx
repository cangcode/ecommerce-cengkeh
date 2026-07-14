"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useDistricts } from "@/hooks/useDistricts";
import { useVillages } from "@/hooks/useVillages";
import axios from "axios";
import { useEffect, useState } from "react";

const formSchema = z.object({
  business_name: z
    .string()
    .min(1, "Masukkan nama toko")
    .max(32, "Maksimal 32 karakter"),
  business_address: z.string().min(1, "Masukkan alamat lengkap toko"),
  phone: z.string().optional(),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 karakter")
    .max(100, "Deskripsi maksimal 100 karakter"),
  district_id: z.string().min(1, "Pilih kecamatan"),
  village_id: z.string().min(1, "Pilih kelurahan/desa"),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  profile: {
    business_name: string;
    business_address: string;
    phone: string | null;
    description: string;
    district_id: string;
    village_id: string;
  };
};

export function SellerProfileForm({ profile }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: profile.business_name,
      business_address: profile.business_address,
      phone: profile.phone ?? "",
      description: profile.description,
      district_id: profile.district_id,
      village_id: profile.village_id,
    },
  });

  const districtId = useWatch({ control: form.control, name: "district_id" });
  const { data: districtsData } = useDistricts();
  const { data: villagesData } = useVillages(districtId);

  // Reset village when district changes
  useEffect(() => {
    if (districtId !== profile.district_id) {
      form.setValue("village_id", "");
    }
  }, [districtId, profile.district_id, form]);

  type DistrictProps = { id: string; name: string };
  const districts: DistrictProps[] =
    districtsData?.data?.value?.map((item: DistrictProps) => ({
      id: item.id.toString(),
      name: item.name,
    })) ?? [];

  type VillageProps = { id: string; name: string };
  const villages: VillageProps[] =
    villagesData?.data?.value?.map((item: VillageProps) => ({
      id: item.id.toString(),
      name: item.name,
    })) ?? [];

  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(data: FormValues) {
    setSubmitError(null);

    try {
      const districtName =
        districts.find((d) => d.id === data.district_id)?.name ?? "";
      const villageName =
        villages.find((v) => v.id === data.village_id)?.name ?? "";

      const response = await axios.put("/api/seller-profiles", {
        ...data,
        phone: data.phone || null,
        district_name: districtName,
        village_name: villageName,
      });
      toast.success(
        response.data?.message || "Profil toko berhasil diperbarui!",
      );
    } catch (error) {
      let message = "Gagal memperbarui profil toko";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      setSubmitError(message);
      toast.error(message);
    }
  }

  return (
    <Card className="w-full ring-0 pt-0">
      <CardHeader className="mb-5">
        <CardTitle className="text-3xl font-bold text-cengkeh-brown">
          Profil Toko
        </CardTitle>
        <CardDescription className="text-cengkeh-brown">
          Kelola informasi profil toko Anda di bawah ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-store-profile" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="business_name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="business_name"
                    className="flex-col md:flex-row md:gap-2 gap-0 items-start md:items-center"
                  >
                    Nama Toko
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="business_name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Nama toko Anda"
                    autoComplete="off"
                  />
                </Field>
              )}
            />

            <Controller
              name="business_address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="business_address"
                    className="flex-col md:flex-row md:gap-2 gap-0 items-start md:items-center"
                  >
                    Alamat Toko
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="business_address"
                    aria-invalid={fieldState.invalid}
                    placeholder="Alamat lengkap toko Anda"
                    autoComplete="off"
                  />
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="store-profile-phone"
                    className="flex-col md:flex-row md:gap-2 gap-0 items-start md:items-center"
                  >
                    Nomor WhatsApp (opsional)
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="store-profile-phone"
                    aria-invalid={fieldState.invalid}
                    placeholder="08xxxxxxxxxx"
                    autoComplete="off"
                  />
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="store-profile-description"
                    className="flex-col md:flex-row md:gap-2 gap-0 items-start md:items-center"
                  >
                    Deskripsi Toko
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="store-profile-description"
                      placeholder="Deskripsikan toko Anda"
                      rows={4}
                      className="min-h-24 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    {/* <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.value.length}
                      </InputGroupText>
                    </InputGroupAddon> */}
                  </InputGroup>
                </Field>
              )}
            />

            <Controller
              name="district_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="store-profile-district">
                    Kecamatan
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="store-profile-district"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Pilih kecamatan" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Controller
              name="village_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="store-profile-village">
                    Kelurahan/Desa
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!districtId}
                  >
                    <SelectTrigger
                      id="store-profile-village"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={
                          districtId
                            ? "Pilih kelurahan/desa"
                            : "Pilih kecamatan dulu"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {villages.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            {submitError && (
              <div className="text-xs text-destructive">{submitError}</div>
            )}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.reset({
                business_name: profile.business_name,
                business_address: profile.business_address,
                phone: profile.phone ?? "",
                description: profile.description,
                district_id: profile.district_id,
                village_id: profile.village_id,
              })
            }
          >
            Reset
          </Button>
          <Button type="submit" form="form-store-profile">
            Simpan Perubahan
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
