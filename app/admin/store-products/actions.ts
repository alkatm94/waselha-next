"use server";

import { redirect } from "next/navigation";
import { createStoreProductFromForm, deleteStoreProduct, setStoreProductStatus, updateStoreProductFromForm } from "@/lib/store-products";

function productIdFromForm(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("المنتج غير صحيح.");
  return id;
}

export async function createStoreProductAction(formData: FormData) {
  const product = await createStoreProductFromForm(formData);
  redirect(`/admin/store-products/${product.id}/edit?created=1`);
}

export async function updateStoreProductAction(formData: FormData) {
  const product = await updateStoreProductFromForm(formData);
  redirect(`/admin/store-products/${product.id}/edit?saved=1`);
}

export async function markStoreProductAvailableAction(formData: FormData) {
  const id = productIdFromForm(formData);
  await setStoreProductStatus(id, "AVAILABLE");
  redirect(`/admin/store-products/${id}/edit?published=1`);
}

export async function markStoreProductSoldAction(formData: FormData) {
  const id = productIdFromForm(formData);
  await setStoreProductStatus(id, "SOLD");
  redirect(`/admin/store-products/${id}/edit?sold=1`);
}

export async function hideStoreProductAction(formData: FormData) {
  const id = productIdFromForm(formData);
  await setStoreProductStatus(id, "HIDDEN");
  redirect(`/admin/store-products/${id}/edit?hidden=1`);
}

export async function deleteStoreProductAction(formData: FormData) {
  const id = productIdFromForm(formData);
  await deleteStoreProduct(id);
  redirect("/admin/store-products?deleted=1");
}