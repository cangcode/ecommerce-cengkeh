"use client";

import * as React from "react";
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
  districts_id: z.string().min(1, "Pilih Kecamatan"),
  villages_id: z.string().min(1, "Pilih Kel/Desa"),
});
type FormValues = z.infer<typeof formSchema>;

export function SellerOnboardingForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: "",
      business_address: "",
      description: "",
      districts_id: "",
      villages_id: "",
    },
  });
  type districtProps = {
    id: string;
    name: string;
  };
  const idKecamatan = useWatch({
    control: form.control,
    name: "districts_id",
  });
  console.log();

  const { data: districtsData } = useDistricts();
  const { data: villagesData } = useVillages(idKecamatan);
  console.log(villagesData);

  const filteredDistrictData: districtProps[] =
    districtsData?.data?.value?.map((item: districtProps) => ({
      id: item.id.toString(),
      name: item.name,
    })) || [];

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast("You submitted the following values:", {
      description: (
        <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-code p-4 text-code-foreground">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: "bottom-right",
      classNames: {
        content: "flex flex-col gap-2",
      },
      style: {
        "--border-radius": "calc(var(--radius)  + 4px)",
      } as React.CSSProperties,
    });
  }

  return (
    <Card className="w-full sm:max-w-md my-10">
      <CardHeader className="justify-center text-center">
        <CardTitle className="text-2xl font-bold text-cengkeh-brown">
          Lengkapi data
        </CardTitle>
        <CardDescription className="text-cengkeh-brown">
          Isi detail informasi tentang toko anda untuk mulai menjual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
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
              name="districts_id"
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
              name="villages_id"
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
                    placeholder="Masukkan alamat lengkap ..."
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
          <Button type="submit" form="form-rhf-demo">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
