"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDistricts } from "@/hooks/useDistricts";
import { useVillages } from "@/hooks/useVillages";
import axios from "axios";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  recipient_name: z.string().min(1, "Masukkan nama penerima"),
  phone: z.string().min(1, "Masukkan nomor telepon"),
  district_id: z.string().min(1, "Pilih Kecamatan"),
  village_id: z.string().min(1, "Pilih Kel/Desa"),
  address: z.string().min(1, "Masukkan alamat lengkap"),
  is_default: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddressForm() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient_name: "",
      phone: "",
      district_id: "",
      village_id: "",
      address: "",
      is_default: false,
    },
  });

  const districtId = useWatch({
    control: form.control,
    name: "district_id",
  });

  const { data: districtsData } = useDistricts();
  const { data: villagesData } = useVillages(districtId);

  useEffect(() => {
    form.setValue("village_id", "");
  }, [districtId, form]);

  type DistrictProps = {
    id: string;
    name: string;
  };

  const filteredDistrictData: DistrictProps[] =
    districtsData?.data?.value?.map((item: DistrictProps) => ({
      id: item.id.toString(),
      name: item.name,
    })) || [];

  async function onSubmit(data: FormValues) {
    try {
      const districtName =
        filteredDistrictData.find((d) => d.id === data.district_id)?.name ?? "";
      const villageName =
        villagesData?.data?.value?.find(
          (v: { id: string; name: string }) => v.id === data.village_id,
        )?.name ?? "";

      const response = await axios.post("/api/addresses", {
        ...data,
        district_name: districtName,
        village_name: villageName,
      });

      toast.success(response.data?.message || "Alamat berhasil ditambahkan!");
      form.reset();
      router.push("/dashboard/addresses");
    } catch (error) {
      let message = "Gagal menambahkan alamat";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    }
  }

  return (
    <Card className="w-full pt-0 ring-0">
      <CardHeader className="mb-5">
        <CardTitle className="text-3xl font-bold text-cengkeh-brown">
          Tambah Alamat
        </CardTitle>
        <CardDescription className="text-cengkeh-brown">
          Daftar alamat anda akan tersiman di sini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-address-add" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="recipient_name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="recipient_name">
                    Nama Penerima
                  </FieldLabel>
                  <Input
                    {...field}
                    id="recipient_name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Nama penerima paket"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="phone">Nomor Telepon</FieldLabel>
                  <Input
                    {...field}
                    id="phone"
                    aria-invalid={fieldState.invalid}
                    placeholder="08xxxxxxxxxx"
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
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
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
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="villages">Kelurahan/Desa</FieldLabel>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!districtId}
                  >
                    <SelectTrigger
                      id="villages"
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
                  {!districtId && (
                    <FieldDescription>
                      Silahkan pilih kecamatan terlebih dahulu!
                    </FieldDescription>
                  )}
                </Field>
              )}
            />

            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="address">Alamat Lengkap</FieldLabel>
                  <Input
                    {...field}
                    id="recipient_name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Nama penerima paket"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="is_default"
              control={form.control}
              render={({ field }) => (
                <Field orientation="vertical">
                  <FieldContent>
                    <FieldLabel htmlFor="is_default">
                      Jadikan alamat utama
                    </FieldLabel>
                    <FieldDescription>
                      Alamat ini akan dipakai sebagai default saat checkout.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="is_default"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
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
          <Button type="submit" form="form-address-add">
            Simpan Alamat
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
