"use client";

import {
  CldImage,
  CldUploadWidget,
  CloudinaryUploadWidgetInfo,
} from "next-cloudinary";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { formatRupiah, parseRupiahToNumber, slugify } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export const formSchema = z
  .object({
    title: z
      .string()
      .min(5, "Masukkan Judul minimal 4 karakter")
      .max(32, "Nama Judul maksimal 32 karakter"),
    description: z
      .string()
      .min(20, "Deskripsi minimal 20 karakter")
      .max(150, "Deskripsi maksimal 150 karakter"),
    price: z.number().min(1, "Masukkan harga produk"),
    weight_unit: z.string().min(1, "Pilih unit berat"),
    is_wholesale: z.boolean(),
    wholesale_price: z.number().optional(),
    wholesale_qty: z.number().optional(),
    stock: z.number().min(1, "Masukkan minimum pembelian"),
    image_url: z.array(
      z.object({
        public_id: z.string(),
        secure_url: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.is_wholesale) return;

    if (!data.wholesale_price || data.wholesale_price < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["wholesale_price"],
        message: "Masukkan harga grosir",
      });
    }

    if (!data.wholesale_qty || data.wholesale_qty < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["wholesale_qty"],
        message: "Masukkan minimum pembelian",
      });
    }
  });

const weightUnit = [
  { label: "kg", value: "kg" },
  { label: "gram", value: "gram" },
] as const;

type ProductData = {
  slug: string;
  title: string;
  description: string;
  price: number;
  weight_unit: string;
  stock: number;
  wholesale_price: number | null;
  wholesale_qty: number | null;
  image_url: { public_id: string; secure_url: string }[];
};

export function EditProductForm({ product }: { product: ProductData }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: product.title,
      description: product.description,
      price: product.price,
      weight_unit: product.weight_unit ?? "kg",
      is_wholesale: !!(product.wholesale_price && product.wholesale_qty),
      wholesale_price: product.wholesale_price ?? 0,
      wholesale_qty: product.wholesale_qty ?? 0,
      stock: product.stock,
      image_url: product.image_url ?? [],
    },
  });

  const { data: session } = useSession();
  const weightUnitCurrentValue = form.watch("weight_unit");
  const isWholeSale = form.watch("is_wholesale");
  const [deletingPublicId, setDeletingPublicId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const imagePreviews = useWatch({ control: form.control, name: "image_url" });
  const imageCount = imagePreviews?.length ?? 0;
  const remainingUploadSlots = Math.max(0, 3 - imageCount);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!session?.user.id) {
      setSubmitError("Sesi pengguna tidak ditemukan.");
      toast.error("Sesi pengguna tidak ditemukan.");
      return;
    }

    setSubmitError(null);

    const payload = {
      slug: product.slug,
      title: data.title,
      description: data.description,
      price: data.price,
      weight_unit: data.weight_unit,
      stock: data.stock,
      image_url: data.image_url,
      ...(data.is_wholesale
        ? {
            wholesale_price: data.wholesale_price,
            wholesale_qty: data.wholesale_qty,
          }
        : {
            wholesale_price: null,
            wholesale_qty: null,
          }),
    };

    try {
      const response = await axios.put("/api/products", payload);
      toast.success(response.data?.message || "Produk berhasil diperbarui!");
    } catch (error) {
      let message = "Gagal memperbarui produk";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      setSubmitError(message);
      toast.error(message);
    }
  }

  const handleDelete = async (publicId: string) => {
    try {
      setDeleteError(null);
      setDeletingPublicId(publicId);

      const res = await fetch("/api/cloudinary/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Gagal menghapus gambar");
      }

      if (data?.result?.result !== "ok") {
        throw new Error("Cloudinary belum menghapus gambar");
      }

      const nextImages = (form.getValues("image_url") ?? []).filter(
        (image) => image.public_id !== publicId,
      );

      form.setValue("image_url", nextImages, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } catch (error) {
      console.error(error);
      setDeleteError(
        error instanceof Error ? error.message : "Gagal menghapus gambar",
      );
    } finally {
      setDeletingPublicId(null);
    }
  };

  return (
    <Card className="w-full ring-0 pt-0">
      <CardHeader className="mb-5 px-0">
        <CardTitle className="text-3xl font-bold text-cengkeh-brown">
          Edit Produk
        </CardTitle>
        <CardDescription className="text-cengkeh-brown">
          Ubah detail informasi produk Anda di bawah ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form
          id="form-edit-product"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            {/* judul */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="title"
                    className="flex-col md:flex-row md:gap-2 gap-0 items-start md:items-center"
                  >
                    Judul Produk
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="title"
                    aria-invalid={fieldState.invalid}
                    placeholder="Judul produk"
                    autoComplete="off"
                  />
                </Field>
              )}
            />
            {/* deskripsi */}
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="form-edit-product-description"
                    className="flex-col md:flex-row md:gap-2 gap-0 items-start md:items-center"
                  >
                    Deskripsi
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="form-edit-product-description"
                      placeholder="Masukkan deskripsi produk disini"
                      rows={6}
                      className="min-h-24 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.value.length}/600 characters
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              )}
            />
            {/* upload gambar */}
            <CldUploadWidget
              uploadPreset="ecommerce-cengkeh"
              onSuccess={(result) => {
                const imageInfo = result.info as CloudinaryUploadWidgetInfo;
                const prev = form.getValues("image_url") ?? [];
                form.setValue(
                  "image_url",
                  [
                    ...prev,
                    {
                      public_id: imageInfo.public_id,
                      secure_url: imageInfo.secure_url,
                    },
                  ],
                  { shouldValidate: true, shouldDirty: true },
                );
              }}
              options={{
                multiple: true,
                maxFiles: remainingUploadSlots || 1,
                sources: ["local"],
                resourceType: "image",
                clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
              }}
            >
              {({ open }) => {
                const hasImage = (imagePreviews?.length ?? 0) > 0;
                const isUploadLimitReached = remainingUploadSlots === 0;
                return (
                  <div className="rounded-lg border border-dashed border-input bg-muted/30 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {(imagePreviews ?? []).map((items, index) => {
                        const isDeleting = deletingPublicId === items.public_id;
                        return (
                          <div
                            key={items.public_id}
                            className="group relative rounded-md border bg-background"
                          >
                            <CldImage
                              width="640"
                              height="480"
                              src={items.public_id}
                              alt={`Preview produk ${index + 1}`}
                              className="h-32 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleDelete(items.public_id)}
                              disabled={isDeleting}
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-70"
                              aria-label={`Hapus gambar ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        disabled={isUploadLimitReached}
                        onClick={() => {
                          if (!isUploadLimitReached) open();
                        }}
                        className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Tambah gambar"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-xs font-medium">
                          {isUploadLimitReached ? "Penuh" : "Tambah gambar"}
                        </span>
                      </button>
                    </div>

                    {!hasImage && (
                      <div className="rounded-md border border-input/60 bg-background/70 px-4 py-3 text-center text-sm text-muted-foreground">
                        Belum ada gambar. Klik kartu + untuk upload gambar
                        produk.
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Maksimal 3 gambar. Sisa slot: {remainingUploadSlots}.
                      Format: JPG, JPEG, PNG, WEBP.
                    </p>
                    {deleteError && (
                      <p className="text-xs text-destructive">{deleteError}</p>
                    )}
                  </div>
                );
              }}
            </CldUploadWidget>
            <div className="text-xs/relaxed font-normal text-destructive">
              {form.formState.errors.image_url?.message}
            </div>
            {submitError && (
              <div className="text-xs/relaxed font-normal text-destructive">
                {submitError}
              </div>
            )}

            {/* harga */}
            <div className="flex items-start w-full gap-3">
              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-price">
                      Harga Produk
                    </FieldLabel>
                    <Input
                      name={field.name}
                      ref={field.ref}
                      value={field.value ? formatRupiah(field.value) : ""}
                      id="product-price"
                      type="text"
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      placeholder="Masukkan harga produk ..."
                      autoComplete="off"
                      onBlur={field.onBlur}
                      onChange={(e) =>
                        field.onChange(parseRupiahToNumber(e.target.value))
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError className="text-xs" errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <div className="flex flex-col items-end justify-end pt-6 text-xs">
                per
              </div>

              <Controller
                name="weight_unit"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="vertical" data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-edit-product-select-weight-unit">
                        Unit berat
                      </FieldLabel>
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
                        id="form-edit-product-select-weight-unit"
                        aria-invalid={fieldState.invalid}
                        className="min-w-30"
                      >
                        <SelectValue placeholder="berat" />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        {weightUnit.map((wu) => (
                          <SelectItem key={wu.value} value={wu.value}>
                            {wu.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>
            {/* harga grosir */}
            <Controller
              name="is_wholesale"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  orientation="responsive"
                  data-invalid={fieldState.invalid}
                  className="w-fit py-5"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="is_wholesale">
                      Pakai harga grosir?
                    </FieldLabel>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Switch
                    id="is_wholesale"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              )}
            />
            <div
              className={`items-start w-full gap-3 ${isWholeSale ? "flex" : "hidden"}`}
            >
              <Controller
                name="wholesale_price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="wholesale_price">
                      Harga Grosir
                    </FieldLabel>
                    <Input
                      disabled={!isWholeSale}
                      id="wholesale_price"
                      type="text"
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      placeholder="Masukkan harga grosir ..."
                      autoComplete="off"
                      name={field.name}
                      ref={field.ref}
                      value={field.value ? formatRupiah(field.value) : ""}
                      onBlur={field.onBlur}
                      onChange={(e) =>
                        field.onChange(parseRupiahToNumber(e.target.value))
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError className="text-xs" errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="wholesale_qty"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="wholesale_qty">
                      Minimum Pembelian ({weightUnitCurrentValue})
                    </FieldLabel>
                    <Input
                      {...field}
                      disabled={!isWholeSale}
                      id="wholesale_qty"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="Nama Produk"
                      autoComplete="off"
                      inputMode="numeric"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError className="text-xs" errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            {/* stock */}
            <Controller
              name="stock"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="stock">
                    Jumlah stok produk ({weightUnitCurrentValue})
                  </FieldLabel>
                  <Input
                    {...field}
                    id="stock"
                    type="number"
                    aria-invalid={fieldState.invalid}
                    placeholder="Jumlah stok produk"
                    autoComplete="off"
                    inputMode="numeric"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError className="text-xs" errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
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
                title: product.title,
                description: product.description,
                price: product.price,
                weight_unit: product.weight_unit ?? "kg",
                is_wholesale: !!(product.wholesale_price && product.wholesale_qty),
                wholesale_price: product.wholesale_price ?? 0,
                wholesale_qty: product.wholesale_qty ?? 0,
                stock: product.stock,
                image_url: product.image_url ?? [],
              })
            }
          >
            Reset
          </Button>
          <Button type="submit" form="form-edit-product">
            Simpan Perubahan
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
