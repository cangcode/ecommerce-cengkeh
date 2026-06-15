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
  FieldContent,
  FieldDescription,
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
import { useDistricts } from "@/hooks/useDistricts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useVillages } from "@/hooks/useVillages";
import axios from "axios";
import { useEffect, useState } from "react";
import { log } from "console";
import { useRouter } from "next/navigation";
import { unstable_update } from "@/auth";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  business_name: z
    .string()
    .min(1, "Masukkan nama toko")
    .max(32, "Maksimal 32 Karakter"),
  business_address: z.string().min(1, "Masukkan Alamat lengkap tokomu"),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 Karakter")
    .max(100, "Deskripsi maksimal 100 Karakter"),
  district_id: z.string().min(1, "Pilih Kecamatan"),
  village_id: z.string().min(1, "Pilih Kel/Desa"),
});
type FormValues = z.infer<typeof formSchema>;

export function SellerOnboardingForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: "",
      business_address: "",
      description: "",
      district_id: "",
      village_id: "",
    },
  });
  const idKecamatan = useWatch({
    control: form.control,
    name: "district_id",
  });
  useEffect(() => {
    form.setValue("village_id", "");
  }, [idKecamatan]);
  console.log();
  const router = useRouter();
  const { update, data: session } = useSession();
  const { data: districtsData } = useDistricts();
  const { data: villagesData } = useVillages(idKecamatan);
  console.log(villagesData);

  type districtProps = {
    id: string;
    name: string;
  };
  const filteredDistrictData: districtProps[] =
    districtsData?.data?.value?.map((item: districtProps) => ({
      id: item.id.toString(),
      name: item.name,
    })) || [];

  async function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);

    try {
      const response = await axios.post("/api/seller-profiles", {
        ...data,
        business_name: data.business_name,
        business_address: data.business_address,
        description: data.description,
        district_id: data.district_id,
        village_id: data.village_id,
      });
      await update({ seller_id: response.data.id });
      console.log("sesion baru :", session);

      toast.success(
        response.data?.message || "Profil penjual berhasil dibuat!",
      );
      form.reset();
      router.push("/dashboard");
    } catch (error) {
      let message = "Gagal membuat produk";
      if (axios.isAxiosError(error)) {
        // Di dalam blok ini, TypeScript tahu 'error' adalah AxiosError
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        // Ini untuk error umum JavaScript (misal typo kode/runtime error)
        message = error.message;
      }

      toast.error(message);
    }
  }

  return (
    <Card className="w-full sm:max-w-md my-10">
      <CardHeader className="justify-center text-center">
        <CardTitle className="text-2xl font-bold text-cengkeh-brown">
          Data kamu belung lengkap!
        </CardTitle>
        <CardDescription className="text-cengkeh-brown">
          Isi detail informasi tentang toko anda untuk mulai menjual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="formOnboarding" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="business_name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="business_name">Nama Toko</FieldLabel>
                  <Input
                    {...field}
                    id="business_name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Masukkan nama toko ..."
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="district_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  orientation="responsive"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent>
                    <FieldLabel htmlFor="districts">Kecamatan</FieldLabel>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    name={field.name}
                  >
                    <SelectTrigger
                      id="districts"
                      aria-invalid={fieldState.invalid}
                      className="min-w-30 rounded-md"
                    >
                      <SelectValue placeholder="Pilih Kecamatan" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {filteredDistrictData.map((item) => (
                        <SelectItem key={item.name} value={item.id}>
                          {item.name}
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
                <Field
                  orientation="responsive"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent>
                    <FieldLabel htmlFor="districts">Kelurahan/Desa</FieldLabel>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!idKecamatan}
                  >
                    <SelectTrigger
                      id="districts"
                      aria-invalid={fieldState.invalid}
                      className="min-w-30 rounded-md"
                    >
                      <SelectValue placeholder="Pilih kelurahan/desa" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {villagesData?.data.value.map(
                        (item: { name: string; id: string }) => (
                          <SelectItem key={item.name} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {!idKecamatan && (
                    <FieldDescription>
                      Silahkan pilih kecamatan terlebih dahulu!
                    </FieldDescription>
                  )}
                </Field>
              )}
            />

            <Controller
              name="business_address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="business_address">
                    Alamat Toko
                  </FieldLabel>
                  <Input
                    {...field}
                    id="business_address"
                    aria-invalid={fieldState.invalid}
                    placeholder="Alamat lengkap Jl, RT, RW, Kodepos ..."
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Deskripsi toko</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="description"
                      placeholder="Deksripsikan toko kamu ..."
                      rows={6}
                      className="min-h-24 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.value.length}/100 karakter
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="formOnboarding">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
