<template>
  <NuxtLayout :name="isTreasurer ? 'default' : 'public'">
    <div class="relative">
      <div class="flex px-4 py-3.5 border-b border-accented">
        <UInput
          v-model="globalFilter"
          class="min-w-full"
          placeholder="Golek tonggo here..."
        />
      </div>

      <div class="flex justify-end px-4 py-2">
        <UButton icon="i-heroicons-plus" @click="openCreateForm">
          Tambah Warga
        </UButton>
      </div>
      <UTable
        v-model:global-filter="globalFilter"
        :data="residentData"
        :columns="columns"
        :loading="pending"
        loading-color="primary"
        loading-animation="carousel"
      />
    </div>

    <div class="flex items-center justify-between mt-4">
      <UButton
        :disabled="page <= 1 || pending"
        @click="prevPage"
        icon="i-heroicons-chevron-left"
      />
      <span>Hal {{ page }}</span>
      <UButton
        :disabled="!hasNextPage || pending"
        @click="nextPage"
        icon="i-heroicons-chevron-right"
      />
    </div>
    <UModal v-model:open="modalProfile">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center space-x-4">
            <!-- <img v-if="profile.image_url" :src="profile.image_url" alt="Profile Image" class="w-24 h-24 rounded-full object-cover" /> -->
            <img
              :src="getProxyImageUrl(profile.image_url)"
              alt="Profile Image"
              class="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h2 class="text-xl font-semibold">{{ profile.full_name }}</h2>
              <p class="text-sm text-gray-500">{{ profile.nickname }}</p>
              <p class="text-sm text-gray-500">{{ profile.occupation }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><strong>Status Rumah:</strong> {{ profile.house_status }}</div>
            <div>
              <strong>Status Menikah:</strong>
              {{ profile.is_married ? "Menikah" : "Belum" }}
            </div>
            <div>
              <strong>Sudah dihuni:</strong>
              {{ profile.is_living ? "Ya" : "Tidak" }}
            </div>
            <div>
              <strong>Sudah Alamat VBA:</strong>
              {{ profile.is_ktp_vba ? "Ya" : "Tidak" }}
            </div>
            <div>
              <strong>Nama Pasangan:</strong> {{ profile.partner_name }}
            </div>
            <div><strong>No. HP:</strong> {{ profile.phone_number }}</div>
          </div>

          <div class="text-right">
            <UButton label="Tutup" @click="modalProfile = false" color="gray" />
          </div>
        </div>
      </template>
    </UModal>

    <UDrawer v-model:open="showHouseNumber">
      <template #content>
        <div class="p-4 overflow-y-auto max-h-screen">
          <div class="flex items-center justify-between">
            <!-- <h2 class="text-lg font-semibold">Edit Nomor Rumah</h2> -->
            <UButton
              icon="i-heroicons-plus"
              size="xs"
              @click="addHouseNumberField"
            >
              Tambah
            </UButton>
          </div>
          <div class="space-y-4 p-4">
            <div
              v-for="(item, index) in houseNumbersCollection"
              :key="index"
              class="flex items-center gap-2"
            >
              <!--               <pre class="text-xs bg-gray-100 p-2 rounded"> -->
              <!--   {{ availableHouseNumbers }} -->
              <!-- </pre -->
              <USelectMenu
                v-model="item.id"
                :items="availableHouseNumbers"
                value-key="id"
                placeholder="Pilih Nomor Rumah"
                class="flex-1"
              />
              <!-- <UInput -->
              <!--   v-model="item.name" -->
              <!--   placeholder="Nomor Rumah" -->
              <!--   class="flex-1" -->
              <!-- /> -->
              <UButton
                icon="i-heroicons-x-mark"
                color="red"
                variant="ghost"
                @click="removeHouseNumberField(index)"
                v-if="houseNumbersCollection.length > 1"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 p-4 border-t">
            <UButton
              color="gray"
              variant="ghost"
              @click="showHouseNumber = false"
            >
              Batal
            </UButton>
            <UButton color="primary" @click="saveHouseNumbers">
              Simpan
            </UButton>
          </div>
        </div>
      </template>
    </UDrawer>

    <UModal v-model:open="modalFormOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h2 class="text-lg font-semibold">
            {{ isEditMode ? "Edit Warga" : "Tambah Warga" }}
          </h2>

          <UInput v-model="form.full_name" placeholder="Nama Lengkap" />
          <UInput v-model="form.nickname" placeholder="Nama Panggilan" />
          <UInput v-model="form.phone_number" placeholder="Nomor HP" />
          <UInput v-model="form.occupation" placeholder="Pekerjaan" />

          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="ghost"
              @click="modalFormOpen = false"
            >
              Batal
            </UButton>
            <UButton color="primary" @click="submitForm"> Simpan </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/vue-table";
import { useClipboard } from "@vueuse/core";
import { getRoleName } from "@/composables/useRole";

const UAvatar = resolveComponent("UAvatar");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const modalProfile = ref(false);

const defineShortcuts = () => {
  o: () => (modalProfile.value = !modalProfile.value);
};

definePageMeta({
  title: "Tonggoku",
  subtitle: "Tonggoku yo dulurku..",
});

const supabase = useSupabaseClient();

const page = ref(1);
const pageSize = 10;
const hasNextPage = ref(true);
const globalFilter = ref("");

const from = computed(() => (page.value - 1) * pageSize);
const to = computed(() => from.value + pageSize - 1);

// Gunakan useAsyncData agar data tetap sinkron saat SSR dan CSR
const {
  data: residentData,
  refresh,
  pending,
} = await useAsyncData(
  () => `resident-page-${page.value}-${globalFilter.value}`,
  async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`*,house_number(name)`, { count: "exact" })
      .eq("role", "resident")
      // .ilike('full_name', `%${globalFilter.value}%`)

      .or(
        `full_name.ilike.%${globalFilter.value}%,phone_number.ilike.%${globalFilter.value}%,nickname.ilike.%${globalFilter.value}%,partner_name.ilike.%${globalFilter.value}%`,
      )
      // .or(
      //   `full_name.ilike.%${globalFilter.value}%,phone_number.ilike.%${globalFilter.value}%, nickname.ilike.%${globalFilter.value}%`,
      // )
      .range(from.value, to.value);

    console.log("daata", data);
    if (error) throw error;
    hasNextPage.value = data.length === pageSize;
    return data;
  },
);

// Kolom untuk UTable
type Resident = {
  full_name: string;
  nickname: string;
  phone_number: string;
  image_url?: string;
};

const columns: TableColumn<Resident>[] = [
  {
    accessorKey: "full_name",
    header: "Nama Warga",
    cell: ({ row }) => {
      const avatarSrc =
        getProxyImageUrl(row.original.image_url) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(row.original.full_name)}`;

      return h("div", { class: "flex items-center gap-3" }, [
        h("div", { class: "w-8 h-8 rounded-full overflow-hidden" }, [
          h("img", {
            src: avatarSrc,
            alt: row.original.full_name,
            class: "w-full h-full object-cover",
          }),
        ]),
        h("div", undefined, [
          h("div", { class: "uppercase" }, row.original.full_name),
          h(
            "div",
            { class: "text-sm text-muted capitalize" },
            row.original.nickname,
          ),
        ]),
      ]);
    },
  },
  {
    accessorKey: "partner_name",
    header: "Nama Pasangan",
    cell: ({ row }) => row.getValue("partner_name"),
  },
  {
    accessorKey: "phone_number",
    header: "Nomor Telepon",
    cell: ({ row }) => row.getValue("phone_number"),
  },
  {
    accessorKey: "house_number",
    header: "Nomor Rumah",
    cell: ({ row }) => {
      const houses = row.original.house_number;
      return houses.map((house: any) => house.name).join(", ");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      if (!isTreasurer.value) return;
      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
            items: getRowItems(row),
            "aria-label": "Actions dropdown",
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
              "aria-label": "Actions dropdown",
            }),
        ),
      );
    },
  },
];

// const toast = useToast()
// const { copy } = useClipboard()
// function getRowItems(row: Row<Payment>) {
//   return [
//     {
//       label: "Lihat Profile",
//       onSelect() {
//         showProfile(row.original.id);
//       },
//     },
//     {
//       label: "Nomor Rumah",
//       onSelect() {
//         showEditHouseNumber(row.original.id);
//       },
//     },
//   ];
// }

const profile = ref({
  full_name: "",
  nickname: "",
  occupation: "",
  house_status: "",
  is_married: false,
  is_living: false,
  is_ktp_vba: false,
  partner_name: "",
  phone_number: "",
});

async function showProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (error) {
    console.log("gagal fetching data pofile", error);
  }

  profile.value = data;
  console.log("data profile", data);

  modalProfile.value = true;
}

// Pagination
const nextPage = () => page.value++;
const prevPage = () => page.value--;

// Refresh saat ganti page
watch([page, globalFilter], async () => {
  // set page ke 1 saat ganti global filter
  if (globalFilter.value) page.value = 1;
  await refresh();
});

type HouseNumberItem = {
  id?: string;
  name: string;
};
const houseNumbersCollection = ref<HouseNumberItem[]>([]);
const showHouseNumber = ref(false);

const selectedProfileId = ref<string | null>(null);
const showEditHouseNumber = async (id: string) => {
  selectedProfileId.value = id;
  const { data, error } = await supabase
    .from("house_number")
    .select("id, name")
    .eq("profile_id", id);

  if (error) {
    console.log("Gagal fetching data profile", error);
    return;
  }

  houseNumbersCollection.value =
    data?.map((item) => ({
      name: item.name ?? "", // default kosong jika null
      id: item.id, // simpan ID jika nanti perlu update
    })) || [];

  console.log("data house number", data);

  await fetchAvailableHouseNumbers();
  showHouseNumber.value = true;
};

// Tambahkan field input baru
const addHouseNumberField = () => {
  houseNumbersCollection.value.push({
    name: "",
    id: "",
  });
};

// Hapus field input berdasarkan index
const removeHouseNumberField = (index: number) => {
  houseNumbersCollection.value.splice(index, 1);
};

const availableHouseNumbers = ref<{ id: string; label: string }[]>([]);
const fetchAvailableHouseNumbers = async () => {
  if (!selectedProfileId.value) return;

  // Ambil rumah yang belum dipakai
  const { data: available, error: err1 } = await supabase
    .from("house_number")
    .select("id, name")
    .is("profile_id", null);

  // Ambil rumah milik profile ini
  const { data: owned, error: err2 } = await supabase
    .from("house_number")
    .select("id, name")
    .eq("profile_id", selectedProfileId.value);

  if (err1 || err2) {
    console.error("Gagal mengambil nomor rumah", err1 || err2);
    return;
  }

  const merged = [...(available ?? []), ...(owned ?? [])];

  // Hapus duplikat berdasarkan ID (opsional, jika kemungkinan duplikat)
  const unique = Array.from(
    new Map(merged.map((item) => [item.id, item])).values(),
  );

  availableHouseNumbers.value = unique.map((item) => ({
    id: item.id,
    label: item.name ?? "",
  }));

  console.log("Available + owned house numbers:", availableHouseNumbers.value);
};

watch(showHouseNumber, (val) => {
  if (val) {
    console.log("DRAWER OPEN — Available Numbers", availableHouseNumbers.value);
  }
});

const saveHouseNumbers = async () => {
  if (!selectedProfileId.value) return;

  const profileId = selectedProfileId.value;

  // Ambil semua nomor rumah yang sebelumnya dimiliki user
  const { data: existingHouseNumbers, error: fetchError } = await supabase
    .from("house_number")
    .select("id")
    .eq("profile_id", profileId);

  if (fetchError) {
    console.error("Gagal mengambil data nomor rumah lama:", fetchError);
    return;
  }

  const newIds = houseNumbersCollection.value
    .map((item) => item.id)
    .filter((id): id is string => !!id); // hanya ambil ID valid (yang bukan undefined/null)

  const oldIds = (existingHouseNumbers ?? []).map((item) => item.id);

  // ✅ Nomor rumah yang masih dipakai (tidak berubah): skip
  const toUnassign = oldIds.filter((id) => !newIds.includes(id));
  const toAssign = newIds.filter((id) => !oldIds.includes(id));

  // 🔄 Unassign nomor rumah yang dihapus dari form (set profile_id = null)
  if (toUnassign.length > 0) {
    const { error } = await supabase
      .from("house_number")
      .update({ profile_id: null })
      .in("id", toUnassign);

    if (error) {
      console.error("Gagal unassign nomor rumah:", error);
    }
  }

  // 🔄 Assign nomor rumah baru ke profile
  if (toAssign.length > 0) {
    const { error } = await supabase
      .from("house_number")
      .update({ profile_id: profileId })
      .in("id", toAssign);

    if (error) {
      console.error("Gagal assign nomor rumah baru:", error);
    }
  }

  console.log("Simpan nomor rumah selesai");
  showHouseNumber.value = false;
  await refresh(); // refresh data utam
};

const roleName = ref<string | null>(null);
onMounted(async () => {
  roleName.value = await getRoleName();
});

const isTreasurer = computed(() => roleName.value === "treasurer");

const modalFormOpen = ref(false);
const isEditMode = ref(false);

const form = ref({
  id: null as string | null,
  full_name: "",
  nickname: "",
  phone_number: "",
  occupation: "",
});

function openCreateForm() {
  isEditMode.value = false;
  form.value = {
    id: null,
    full_name: "",
    nickname: "",
    phone_number: "",
    occupation: "",
  };
  modalFormOpen.value = true;
}

function openEditForm(profileData: any) {
  isEditMode.value = true;
  form.value = {
    id: profileData.id,
    full_name: profileData.full_name,
    nickname: profileData.nickname,
    phone_number: profileData.phone_number,
    occupation: profileData.occupation,
  };
  modalFormOpen.value = true;
}

function getRowItems(row: Row<Payment>) {
  return [
    {
      label: "Lihat Profile",
      onSelect() {
        showProfile(row.original.id);
      },
    },
    {
      label: "Nomor Rumah",
      onSelect() {
        showEditHouseNumber(row.original.id);
      },
    },
    {
      label: "Edit Warga",
      onSelect() {
        openEditForm(row.original);
      },
    },
  ];
}

async function submitForm() {
  const { id, ...data } = form.value;

  if (isEditMode.value && id) {
    const { error } = await supabase.from("profiles").update(data).eq("id", id);

    if (error) {
      console.error("Gagal update data", error);
      return;
    }
  } else {
    const { error } = await supabase
      .from("profiles")
      .insert({ ...data, role: "resident" });

    if (error) {
      console.error("Gagal insert data", error);
      return;
    }
  }

  modalFormOpen.value = false;
  await refresh();
}
</script>
