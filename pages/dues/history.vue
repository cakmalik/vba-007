<template>
  <div class="flex flex-col gap-6" v-if="!isReady">
    <div class="flex items-center gap-4 mt-12 p-6 pb-0">
      <USkeleton class="h-12 w-12 rounded-full" />
      <div class="grid gap-2">
        <USkeleton class="h-4 w-[250px]" />
        <USkeleton class="h-4 w-[200px]" />
      </div>
    </div>

    <div class="p-6 flex flex-col gap-4">
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-20 w-full" />
    </div>
  </div>

  <NuxtLayout :name="isTreasurer ? 'default' : 'public'" v-if="isReady">
    <div v-if="isTreasurer"
      class="mb-4 bg-primary-100 dark:bg-primary-600 text-primary-700 dark:text-primary-200 px-6 py-4 rounded-lg shadow-sm flex items-center justify-between">
      <span class="text-base font-medium">Total Lunas</span>
      <span class="text-2xl font-bold tracking-wide">{{
        formatCurrency(totalAmount)
      }}</span>
    </div>
    <div v-if="isTreasurer"
      class="mb-4 bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-200 px-6 py-4 rounded-lg shadow-sm flex items-center justify-between">
      <span class="text-base font-medium">Total Belum Lunas (hanya angka perkiraan jika iuran 50rb semua)</span>
      <span class="text-2xl font-bold tracking-wide">{{
        formatCurrency(totalUnpaidAmount)
      }}</span>
    </div>

    <!-- Filter Row -->
    <div v-if="!kodeRumah" class="flex justify-between flex-wrap items-center mb-4 gap-2">
      <!-- Pencarian Nama -->

      <UInput v-if="isTreasurer" v-model="searchName" placeholder="Cari nama atau panggilan..."
        icon="i-heroicons-magnifying-glass" class="w-full sm:w-1/2 md:w-1/3" />

      <USelectMenu v-if="isTreasurer" v-model="selectedStatus" :items="statusOptions" option-attribute="label"
        value-attribute="value" placeholder="status" class="w-full sm:w-1/3 md:w-1/4" />

      <!-- Filter  -->
      <USelectMenu v-model="selectedBlock" :items="blockOptions" option-attribute="label" value-attribute="value"
        placeholder="Filter Blok" class="w-full sm:w-1/3 md:w-1/4" />
      <!-- Filter Periode -->
      <USelectMenu v-model="selectedPeriod" :items="periodOptions" option-attribute="label" value-attribute="value"
        placeholder="Filter Periode" class="w-full sm:w-1/3 md:w-1/4" />
    </div>

    <UTable :data="duesData" :columns="columns" :loading="pending" loading-color="primary" />

    <div class="flex justify-between mt-4 items-center" v-if="hasNextPage || page > 1">
      <UButton :disabled="page <= 1 || pending" @click="prevPage" icon="i-heroicons-chevron-left" />
      <span>Halaman {{ page }}</span>
      <UButton :disabled="!hasNextPage || pending" @click="nextPage" icon="i-heroicons-chevron-right" />
    </div>

    <!-- Floating Add Button -->
    <UButton v-if="isTreasurer" @click="create" icon="i-lucide-plus" size="2xl" color="info" variant="solid"
      class="fixed bottom-6 right-6 rounded-full px-4 py-4" />

    <UDrawer v-model:open="showForm" :dismissible="false" :ui="{ header: 'flex items-center justify-between' }">
      <template #header>
        <h2 class="text-highlighted font-semibold"></h2>

        <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="showForm = false" />
      </template>
      <template #body>
        <div class="p-6 flex justify-center">
          <UForm :state="form" @submit="submitForm" class="flex flex-wrap gap-4 items-end">
            <USelectMenu :items="profileOptions" icon="i-lucide-user" v-model="selected_profile_id"
              placeholder="Pilih Profile" class="w-48" />

            <USelectMenu v-model="form.house_number_id" :items="houseOptions" label="No Rumah"
              placeholder="Pilih no rumah" class="w-full sm:w-1/2 md:w-1/4" />

            <USelectMenu v-model="form.billing_period_id" :items="periodOptions" option-attribute="label"
              value-attribute="value" label="Periode" placeholder="Pilih periode" class="w-full sm:w-1/2 md:w-1/4" />

            <USelectMenu v-model="form.payment_method_id" :items="paymentOptions" option-attribute="label"
              value-attribute="value" label="Metode Pembayaran" placeholder="Pilih metode"
              class="w-full sm:w-1/2 md:w-1/4" />

            <USelectMenu v-model="form.status" :items="[
              { label: 'BELUM LUNAS', value: 'unpaid' },
              { label: 'LUNAS', value: 'paid' },
            ]" option-attribute="label" value-attribute="value" label="Status" class="w-full sm:w-1/2 md:w-1/4" />

            <UInput v-model="form.amount_override" type="number" label="Jumlah Override"
              class="w-1/2 sm:w-1/2 md:w-1/4" />
            <UInput v-model="form.due_date" type="date" label="Jatuh Tempo" class="w-grow sm:w-1/2 md:w-1/4" required />

            <div class="pt-4">
              <UButton type="submit" color="primary" block>Simpan</UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UDrawer>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Iuran",
  subtitle: "Data Iuran Bulanan Warga",
  layout: "default",
});

const route = useRoute();
const router = useRouter();

if (route.query.code == "007") {
  router.push(`/pay`);
}

import { h, onMounted, ref, computed, watch } from "vue";
import { useDateFormat } from "@vueuse/core";
import type { TableColumn } from "@nuxt/ui";
import { UButton } from "#components";
import { getRoleName } from "@/composables/useRole";
import { useDebounce } from "@vueuse/core";
import type { AvatarProps } from "@nuxt/ui";

const kodeRumah = route.query.code;

const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");

const supabase = useSupabaseClient();

const { data: users, status } = await useFetch(
  "https://jsonplaceholder.typicode.com/users",
  {
    key: "typicode-users",
    transform: (data: { id: number; name: string }[]) => {
      return data?.map((user) => ({
        label: user.name,
        value: String(user.id),
        avatar: { src: `https://i.pravatar.cc/120?img=${user.id}` },
      }));
    },
    lazy: true,
  },
);

// Pagination
const page = ref(1);
const pageSize = 15;
const hasNextPage = ref(true);
const from = computed(() => (page.value - 1) * pageSize);
const to = computed(() => from.value + pageSize - 1);
const searchName = ref("");
const selectedPeriod = ref(null);
const selectedBlock = ref(null);
const selectedStatus = ref("paid");
const totalAmount = ref(0);
const totalUnpaidAmount = ref(0);

const debouncedSearchName = useDebounce(searchName, 400);

watch(page, async () => {
  await refresh();
  fetchTotalAmount();
  fetchTotalUnpaidAmount();
});

watch([debouncedSearchName, selectedPeriod, selectedBlock], async () => {
  page.value = 1;
  await refresh();
  fetchTotalAmount();
  fetchTotalUnpaidAmount();
});

async function fetchTotalAmount() {
  let query = supabase
    .from("profile_dues")
    .select("amount_override, profiles(nickname, full_name)")
    .eq("status", "paid");

  const term = debouncedSearchName.value.trim();

  if (term) {
    // NOTE: Supabase tidak bisa pakai .or() dengan nested fields
    // Jadi ambil semua dulu, lalu filter manual
    const { data, error } = await query;

    if (error) {
      console.error("Gagal ambil total:", error);
      totalAmount.value = 0;
      return;
    }

    const filtered = data.filter((item) => {
      const name = item.profiles?.full_name?.toLowerCase() ?? "";
      const nick = item.profiles?.nickname?.toLowerCase() ?? "";
      return (
        name.includes(term.toLowerCase()) || nick.includes(term.toLowerCase())
      );
    });

    totalAmount.value = filtered.reduce(
      (sum, item) => sum + (item.amount_override || 0),
      0,
    );
    return;
  }

  // Jika tidak ada pencarian nama, lanjut query normal
  if (selectedPeriod.value) {
    const periodId = selectedPeriod.value.value ?? selectedPeriod.value;
    query = query.eq("billing_period_id", periodId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal ambil total:", error);
    totalAmount.value = 0;
    return;
  }

  totalAmount.value = data.reduce(
    (sum, item) => sum + (item.amount_override || 0),
    0,
  );
}

async function fetchTotalUnpaidAmount() {
  let query = supabase
    .from("profile_dues")
    .select("amount_override, profiles(nickname, full_name)")
    .eq("status", "unpaid");

  const term = debouncedSearchName.value.trim();

  if (term) {
    const { data, error } = await query;

    if (error) {
      console.error("Gagal ambil total unpaid:", error);
      totalUnpaidAmount.value = 0;
      return;
    }

    const filtered = data.filter((item) => {
      const name = item.profiles?.full_name?.toLowerCase() ?? "";
      const nick = item.profiles?.nickname?.toLowerCase() ?? "";
      return (
        name.includes(term.toLowerCase()) || nick.includes(term.toLowerCase())
      );
    });

    totalUnpaidAmount.value = filtered.reduce(
      (sum, item) => sum + (item.amount_override || 0),
      0,
    );
    return;
  }

  if (selectedPeriod.value) {
    const periodId = selectedPeriod.value.value ?? selectedPeriod.value;
    query = query.eq("billing_period_id", periodId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal ambil total unpaid:", error);
    totalUnpaidAmount.value = 0;
    return;
  }

  totalUnpaidAmount.value = data.reduce(
    (sum, item) => sum + (item.amount_override || 0),
    0,
  );
}

const {
  data: duesData,
  refresh,
  pending,
} = await useAsyncData(
  () =>
    `profile-dues-page-${page.value}-${debouncedSearchName.value}-${selectedPeriod.value?.value ?? selectedPeriod.value}-${selectedBlock.value?.value ?? selectedBlock.value}-${selectedStatus.value?.value ?? selectedStatus.value}-${kodeRumah}`,
  async () => {
    const term = debouncedSearchName.value.trim().toLowerCase();
    const periodId = selectedPeriod.value?.value ?? selectedPeriod.value;
    console.log("periodId", periodId);
    const blockId = selectedBlock.value?.value;
    const status = selectedStatus.value?.value ?? selectedStatus.value;
    // console.log("term", term);
    console.log("periodId", periodId);
    console.log("blockId baru", blockId);

    let query = supabase
      .from("profile_dues")
      .select(
        `
        *,
        profiles!profile_dues_profile_id_fkey(nickname, full_name, image_url,phone_number),
        house_number:house_number_id!inner(name, housing_block_id, code),
        payment_methods!profile_dues_payment_method_id_fkey(name),
        billing_periods!fk_period(month, year)
        `,
      )
      .range(from.value, to.value)
      .order("due_date", { ascending: false });

    // Filter periode
    if (periodId) {
      query = query.eq("billing_period_id", periodId);
    }

    if (kodeRumah != null && kodeRumah != undefined) {
      query = query.eq("house_number.code", kodeRumah);
    } else {
      if (blockId !== null && blockId !== "all") {
        query = query.eq("house_number.housing_block_id", blockId);
      }
    }

    console.log("status query", status);

    if (status !== null && status.value !== null) {
      // query = query.eq("status", status.toLowerCase());
      query = query.ilike("status", `${status}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Manual filter pencarian nama (karena Supabase tidak mendukung `or()` di relasi)
    const filtered = data.filter((item) => {
      const fullName = item.profiles?.full_name?.toLowerCase() ?? "";
      const nickname = item.profiles?.nickname?.toLowerCase() ?? "";
      return !term || fullName.includes(term) || nickname.includes(term);
    });

    hasNextPage.value = filtered.length === pageSize;

    return filtered;
  },
);

const nextPage = () => page.value++;
const prevPage = () => page.value--;

// Format
function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

// Kolom tabel
const columns: TableColumn[] = [
  {
    accessorKey: "full_name",
    header: "Nama Warga",
    cell: ({ row }) => {
      const avatarSrc =
        getProxyImageUrl(row.original.profiles.image_url) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(row.original.profiles.full_name)}`;

      return h("div", { class: "flex items-center gap-3" }, [
        h("div", { class: "w-8 h-8 rounded-full overflow-hidden" }, [
          h("img", {
            src: avatarSrc,
            alt: row.original.profiles.full_name,
            class: "w-full h-full object-cover",
          }),
        ]),
        h("div", undefined, [
          h("div", { class: "uppercase" }, row.original.profiles.full_name),
          h(
            "div",
            { class: "text-sm text-muted capitalize" },
            row.original.profiles.nickname,
          ),
        ]),
      ]);
    },
  },
  {
    accessorKey: "house_number.name",
    header: "No Rumah",
    cell: ({ row }) => row.original.house_number.name,
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const rawStatus = row.getValue("status") as string;
      const status = rawStatus.toLowerCase();
      const color = {
        paid: "success" as const,
        unpaid: "error" as const,
      }[status];

      const label = {
        paid: "Lunas",
        unpaid: "Belum Lunas",
      }[status];

      return h(
        UBadge,
        { class: "capitalize", variant: "subtle", color },
        () => label,
      );
    },
  },
  {
    accessorKey: "billing_periods.month",
    header: "Periode",
    cell: ({ row }) =>
      `${namaBulanDariAngka(row.original.billing_periods.month)}/${row.original.billing_periods.year}`,
  },
  {
    accessorKey: "payment_methods.name",
    header: "Metode Bayar",
    cell: ({ row }) => row.original.payment_methods.name,
  },
  {
    accessorKey: "amount_override",
    header: "Jumlah",
    cell: ({ row }) => formatCurrency(row.getValue("amount_override")),
  },

  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) => {
  //     const color = {
  //       paid: "success" as const,
  //       unpaid: "error" as const,
  //     }[row.getValue("type") as string];
  //
  //     return h(UBadge, { class: "capitalize", variant: "subtle", color }, () =>
  //       row.getValue("status"),
  //     );
  //   },
  // },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) =>
  //     row.getValue("status") === "unpaid" ? "Belum Lunas" : "Lunas",
  // },
  // {
  //   accessorKey: "code",
  //   header: "Kode",
  //   cell: ({ row }) => {
  //     return h(UBadge, { variant: "subtle", color: "info" }, () =>
  //       row.getValue("code"),
  //     );
  //   },
  // },

  {
    accessorKey: "created_at",
    header: "Tanggal",
    cell: ({ row }) =>
      useDateFormat(row.getValue("created_at"), "DD/MM/YYYY").value,
  },

  {
    id: "actions",
    cell: ({ row }) => {
      if (!isTreasurer.value || row.original.status === "unpaid") return null;

      const buttons = [
        h(
          UButton,
          {
            icon: "i-lucide-edit",
            variant: "ghost",
            onClick: () => editData(row.original.id),
          },
          () => "Edit",
        ),
      ];

      if (row.original.code && (row.original.status == "paid" || row.original.status == "PAID")) {
        buttons.push(
          h(
            UButton,
            {
              icon: "i-lucide-send",
              variant: "ghost",
              color: "primary",
              onClick: () => sendInvoiceViaWa(row.original),
            },
            () => "Kirim WA",
          ),
          h(
            UButton,
            {
              icon: "i-lucide-file-text",
              variant: "ghost",
              color: "primary",
              onClick: () => {
                router.push(`/invoice/${row.original.code}`);
              },
            },
            () => "Bukti",
          ),
        );
      }

      return h("div", { class: "flex gap-2" }, buttons);
    },
  },
];

// Form
const showForm = ref(false);
const selected_profile_id = ref(null);
const form = ref({
  id: undefined,
  profile_id: "",
  house_number_id: null,
  billing_period_id: null,
  payment_method_id: null,
  amount_override: 0,
  due_date: "",
  status: "unpaid",
});
const isEdit = computed(() => !!form.value.id);

function resetForm() {
  const defaultPayment = paymentOptions.value[1] ?? null;

  form.value = {
    id: undefined,
    profile_id: "",
    house_number_id: null,
    billing_period_id: selectedPeriod.value ?? null,
    payment_method_id: defaultPayment,
    amount_override: 50000,
    due_date: new Date().toISOString().split("T")[0], // hari ini
    status: { label: "Paid", value: "paid" },
  };
}

function create() {
  resetForm();
  showForm.value = true;
}

function editData(id: number) {
  const item = duesData.value?.find((i) => i.id === id);
  if (!item) return;

  form.value = {
    id: item.id,
    profile_id: item.profile_id,
    house_number_id: item.house_number_id,
    billing_period_id: item.billing_period_id,
    payment_method_id: item.payment_method_id,
    amount_override: item.amount_override,
    due_date: item.due_date,
    status: item.status,
  };

  showForm.value = true;
}

// .eq("id", form.value.profile_id?.value?.house_id);
function mapFormToPayload(form: any) {
  // console.log("selected_profile_id", selected_profile_id.value);
  // console.log("billing_period", form.billing_period_id);

  return {
    profile_id: selected_profile_id.value?.value?.profile_id,
    house_number_id: selected_profile_id.value?.value?.house_id,
    billing_period_id: form.billing_period_id?.value ?? form.billing_period_id,
    payment_method_id: form.payment_method_id?.value ?? form.payment_method_id,
    amount_override: form.amount_override,
    due_date: form.due_date,
    status: form.status?.value ?? form.status,
  };
}

async function submitForm() {
  const { id } = form.value;
  const payload = mapFormToPayload(form.value);

  if (!isEdit.value) {
    payload.code = generateRandomCode();
  }

  // 🔍 Cek apakah data sudah ada
  const { data: existingDues, error: checkError } = await supabase
    .from("profile_dues")
    .select("*")
    .eq("billing_period_id", payload.billing_period_id)
    .eq("house_number_id", payload.house_number_id)
    .eq("status", "unpaid")
    .maybeSingle(); // gunakan maybeSingle agar tidak error kalau hasilnya null

  let res;

  if (existingDues) {
    // ✅ Kalau data sudah ada → update jadi paid
    res = await supabase
      .from("profile_dues")
      .update({
        status: "paid",
        amount_override: payload.amount_override,
        due_date: payload.due_date,
        code: payload.code,
      })
      .eq("id", existingDues.id)
      .select()
      .single();
  } else if (!isEdit.value) {
    // ✅ Insert baru
    res = await supabase.from("profile_dues").insert(payload).select().single();
  } else {
    // ✅ Edit mode
    res = await supabase
      .from("profile_dues")
      .update(payload)
      .eq("id", id!)
      .select()
      .single();
  }

  if (res.error) {
    console.error(res.error);
    return;
  }

  const dues = res.data;

  // ✅ Tambah ke cash_flows hanya jika insert baru
  if (!isEdit.value) {
    const cashFlowPayload = {
      date: payload.due_date,
      type: "in",
      amount: payload.amount_override,
      description: `Pembayaran iuran bulan ${form.value.billing_period_id?.label} oleh ${selected_profile_id.value?.label}`,
      source: "iuran",
      category_id: null,
      recorded_by: payload.profile_id,
      reference_id: dues.id,
    };

    const cashRes = await supabase
      .from("cash_flows")
      .insert(cashFlowPayload)
      .select()
      .single();

    if (cashRes.error) {
      console.error("Gagal simpan ke cash_flows:", cashRes.error);
    }
  }

  await refresh();
  showForm.value = false;
}
// Dropdown
const profileOptions = ref([]);
const paymentOptions = ref([]);
const periodOptions = ref([]);
const houseOptions = ref([]);
const blockOptions = ref([]);
const statusOptions = ref([
  { label: "Semua", value: null },
  { label: "Paid", value: "paid" },
  { label: "Unpaid", value: "unpaid" },
]);
const roleName = ref<string | null>(null);

const isTreasurer = computed(() => roleName.value === "treasurer");
const isReady = ref(false);
onMounted(async () => {
  roleName.value = await getRoleName();
  fetchTotalAmount();
  fetchTotalUnpaidAmount();
  const [profilesRes, paymentsRes, periodsRes, housesRes, blocksRes] =
    await Promise.all([
      supabase.from("profiles").select("id, nickname").eq("role", "resident"),
      supabase.from("payment_methods").select("id, name"),
      supabase
        .from("billing_periods")
        .select("id, month, year")
        .order("id", { ascending: false }),
      supabase.from("house_number").select("id, profile_id, name"),
      supabase.from("housing_blocks").select("id, name"),
    ]);

  const profiles = profilesRes.data || [];
  const houses = housesRes.data || [];

  profileOptions.value = profiles.flatMap((p) => {
    const housesForProfile = houses.filter((h) => h.profile_id === p.id);
    const nickname = p.nickname.toLowerCase();

    if (housesForProfile.length === 0) {
      return [{ label: nickname, value: { profile_id: p.id, house_id: null } }];
    }

    return housesForProfile.map((house) => ({
      label: `${nickname} - ${house.name}`,
      value: { profile_id: p.id, house_id: house.id },
    }));
  });

  paymentOptions.value =
    paymentsRes.data?.map((p) => ({ label: p.name, value: p.id })) || [];

  blockOptions.value = [
    { label: "Semua Blok", value: null },
    ...(blocksRes.data?.map((h) => ({ label: h.name, value: h.id })) || []),
  ];
  selectedBlock.value = blockOptions.value[0];

  periodOptions.value =
    periodsRes.data?.map((p) => ({
      label: `${namaBulanDariAngka(p.month)} ${p.year}`,
      value: p.id,
    })) || [];

  const now = new Date();
  const selectedMonth = now.getMonth() + 1;
  const selectedYear = now.getFullYear();

  const selectedPeriodObj = periodsRes.data?.find(
    (p) => p.month === selectedMonth && p.year === selectedYear,
  );

  if (selectedPeriodObj) {
    selectedPeriod.value = {
      label: `${namaBulanDariAngka(selectedPeriodObj.month)} ${selectedPeriodObj.year}`,
      value: selectedPeriodObj.id,
    };
  }

  isReady.value = true;
});

watch(
  () => selected_profile_id.value,
  async (newVal) => {
    await getHouseNumbers();
  },
);

const getHouseNumbers = async () => {
  const houseId = selected_profile_id.value?.value?.house_id;
  // console.log("profileIdOk", houseId);
  const { data: nomerRumah, error } = await supabase
    .from("house_number")
    .select("id, profile_id, name")
    .eq("id", houseId);

  if (error) {
    console.error("Error fetching house numbers:", error);
    return;
  }

  console.log("data nomer rumah", nomerRumah);
  houseOptions.value = nomerRumah.map((h) => ({ label: h.name, value: h.id }));

  //if exists set default house number
  if (houseOptions.value.length > 0) {
    form.value.house_number_id = houseOptions.value[0];
  }
};

function generateRandomCode(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}

// watch(
//   () => form.value.selectedBlock,
//   async (newVal) => {
//     await get();
//   },
// );
//

const config = useRuntimeConfig();

// console.log("Runtime config:", config);
if (import.meta.server) {
  // console.log("API secret:", config.fonnte);
  const tokenwa = config.fonnte;
}

const toast = useToast();

function showToast(success = true) {
  if (!success) {
    toast.add({
      title: "Upss!",
      description: "Gagal mengirim wa",
      color: "error",
    });
  } else {
    toast.add({
      title: "Yeee",
      description: "Berhasil mengirim wa ke Ybs",
      color: "success",
    });
  }
}

async function sendInvoiceViaWa(data: any) {
  console.log(data);
  if (!data?.profiles?.phone_number || !data?.code) {
    alert("Nomor telepon tidak tersedia atau data tidak lengkap");
    return;
  }

  try {
    const response = await fetch("/api/send-wa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const res = await response.json();

    if (res.status) {
      showToast();
    } else {
      console.error("WA error:", res);
      showToast(false);
    }
  } catch (error) {
    console.error("WA error:", error);
    showToast(false);
  }
}

function parsePhoneNumber(raw: string): string {
  let phone = raw.replace(/\D/g, ""); // hapus semua non-digit

  if (phone.startsWith("0")) {
    phone = "62" + phone.slice(1);
  } else if (phone.startsWith("+")) {
    phone = phone.replace(/^\+/, "");
  } else if (!phone.startsWith("62")) {
    // jika tidak pakai awalan 0 atau 62, anggap lokal
    phone = "62" + phone;
  }

  return phone;
}
</script>
