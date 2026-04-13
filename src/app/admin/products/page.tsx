"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
  sort_order: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  macbook: "MacBook",
};

function fmt(n: number) {
  return n.toLocaleString("th-TH");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [recentlyEdited, setRecentlyEdited] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("iphone");
  const [newPrice, setNewPrice] = useState("");
  const [addError, setAddError] = useState("");

  // Bulk edit
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMode, setBulkMode] = useState<"percent" | "amount">("percent");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkDirection, setBulkDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase.from("products").select("*").order("sort_order");
    if (data) setProducts(data);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = filter === "all" ? products : products.filter((p) => p.category === filter);

  const stats = {
    iphone: products.filter((p) => p.category === "iphone").length,
    ipad: products.filter((p) => p.category === "ipad").length,
    macbook: products.filter((p) => p.category === "macbook").length,
    minPrice: products.length ? Math.min(...products.map((p) => p.price)) : 0,
    maxPrice: products.length ? Math.max(...products.map((p) => p.price)) : 0,
  };

  // Inline price edit
  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditPrice(String(product.price));
    setTimeout(() => editRef.current?.focus(), 50);
  }

  async function savePrice(productId: string) {
    const price = parseInt(editPrice);
    if (isNaN(price) || price <= 0) {
      setEditingId(null);
      return;
    }

    const { error } = await supabase.from("products").update({ price, updated_at: new Date().toISOString() }).eq("id", productId);
    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, price } : p)));
      setRecentlyEdited(productId);
      setTimeout(() => setRecentlyEdited(null), 2000);
      showToast("บันทึกราคาแล้ว");
    }
    setEditingId(null);
  }

  async function toggleActive(product: Product) {
    const { error } = await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
      showToast(product.active ? "ปิดการแสดงสินค้าแล้ว" : "เปิดการแสดงสินค้าแล้ว");
    }
  }

  async function handleAdd() {
    setAddError("");
    if (!newName.trim()) { setAddError("กรุณากรอกชื่อสินค้า"); return; }
    const priceNum = parseInt(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) { setAddError("ราคาต้องเป็นตัวเลขมากกว่า 0"); return; }
    if (products.some((p) => p.name.toLowerCase() === newName.trim().toLowerCase())) { setAddError("ชื่อสินค้าซ้ำ"); return; }

    const { data, error } = await supabase
      .from("products")
      .insert({ name: newName.trim(), category: newCategory, price: priceNum, sort_order: products.length + 1 })
      .select()
      .single();

    if (error) { setAddError("เกิดข้อผิดพลาด"); return; }
    setProducts((prev) => [...prev, data]);
    setShowAddModal(false);
    setNewName("");
    setNewPrice("");
    showToast("เพิ่มสินค้าแล้ว");
  }

  async function handleDelete(product: Product) {
    if (!confirm(`ลบ ${product.name}? ราคา ฿${fmt(product.price)}`)) return;

    // Check if product has applications
    const { count } = await supabase.from("applications").select("id", { count: "exact", head: true }).eq("product_id", product.id);
    if (count && count > 0) {
      // Deactivate instead of delete
      await supabase.from("products").update({ active: false }).eq("id", product.id);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: false } : p)));
      showToast("สินค้ามีใบสมัครผูกอยู่ เปลี่ยนเป็นไม่แสดงแทน");
    } else {
      await supabase.from("products").delete().eq("id", product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast("ลบสินค้าแล้ว");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkEdit() {
    const val = parseFloat(bulkValue);
    if (isNaN(val) || val <= 0) return;

    const updates: { id: string; price: number }[] = [];
    products.forEach((p) => {
      if (!selectedIds.has(p.id)) return;
      let newPrice: number;
      if (bulkMode === "percent") {
        newPrice = bulkDirection === "up" ? Math.round(p.price * (1 + val / 100)) : Math.round(p.price * (1 - val / 100));
      } else {
        newPrice = bulkDirection === "up" ? p.price + val : p.price - val;
      }
      if (newPrice > 0) updates.push({ id: p.id, price: Math.round(newPrice) });
    });

    for (const u of updates) {
      await supabase.from("products").update({ price: u.price, updated_at: new Date().toISOString() }).eq("id", u.id);
    }

    setProducts((prev) =>
      prev.map((p) => {
        const update = updates.find((u) => u.id === p.id);
        return update ? { ...p, price: update.price } : p;
      })
    );

    setShowBulkModal(false);
    setSelectedIds(new Set());
    setBulkValue("");
    showToast(`อัปเดตราคา ${updates.length} รายการแล้ว`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้าและราคา</h1>
        <button className="btn-primary text-sm" onClick={() => setShowAddModal(true)}>
          + เพิ่มสินค้า
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-lg font-bold text-blue-600">{stats.iphone}</p>
          <p className="text-xs text-gray-600">iPhone</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-lg font-bold text-purple-600">{stats.ipad}</p>
          <p className="text-xs text-gray-600">iPad</p>
        </div>
        <div className="bg-gray-100 rounded-xl p-3">
          <p className="text-lg font-bold text-gray-600">{stats.macbook}</p>
          <p className="text-xs text-gray-600">MacBook</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-lg font-bold text-green-600">฿{fmt(stats.minPrice)}</p>
          <p className="text-xs text-gray-600">ราคาต่ำสุด</p>
        </div>
        <div className="bg-[#D4AF37]/10 rounded-xl p-3">
          <p className="text-lg font-bold text-[#D4AF37]">฿{fmt(stats.maxPrice)}</p>
          <p className="text-xs text-gray-600">ราคาสูงสุด</p>
        </div>
      </div>

      {/* Filter + Bulk */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: "all", label: "ทั้งหมด" },
            { value: "iphone", label: "iPhone" },
            { value: "ipad", label: "iPad" },
            { value: "macbook", label: "MacBook" },
          ].map((f) => (
            <button
              key={f.value}
              className={`pill whitespace-nowrap ${filter === f.value ? "active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {selectedIds.size > 0 && (
          <button className="btn-outline text-sm" onClick={() => setShowBulkModal(true)}>
            อัปเดตราคา ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={() => {
                        if (selectedIds.size === filtered.length) setSelectedIds(new Set());
                        else setSelectedIds(new Set(filtered.map((p) => p.id)));
                      }}
                      className="accent-[#C9252B]"
                    />
                  </th>
                  <th className="p-3 text-left font-medium text-gray-600">สินค้า</th>
                  <th className="p-3 text-left font-medium text-gray-600">หมวดหมู่</th>
                  <th className="p-3 text-right font-medium text-gray-600">ราคา (บาท)</th>
                  <th className="p-3 text-center font-medium text-gray-600">สถานะ</th>
                  <th className="p-3 text-center font-medium text-gray-600">แก้ไข</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      recentlyEdited === product.id ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="accent-[#C9252B]"
                      />
                    </td>
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3">
                      <span className="badge bg-gray-100 text-gray-600">
                        {CATEGORY_LABELS[product.category]}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {editingId === product.id ? (
                        <input
                          ref={editRef}
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          onBlur={() => savePrice(product.id)}
                          onKeyDown={(e) => { if (e.key === "Enter") savePrice(product.id); if (e.key === "Escape") setEditingId(null); }}
                          className="input-field w-28 text-right text-sm py-1"
                        />
                      ) : (
                        <button
                          className="text-right font-medium hover:text-[#C9252B] cursor-pointer"
                          onClick={() => startEdit(product)}
                        >
                          ฿{fmt(product.price)}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          product.active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            product.active ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      {!product.active && (
                        <span className="badge bg-red-50 text-red-500 ml-2">ไม่แสดง</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="เพิ่มสินค้าใหม่">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
              <input className="input-field" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น iPhone 16 Pro 256GB" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select className="input-field" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                <option value="iphone">iPhone</option>
                <option value="ipad">iPad</option>
                <option value="macbook">MacBook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
              <input className="input-field" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="เช่น 34990" />
            </div>
            {addError && <p className="text-red-500 text-sm">{addError}</p>}
            <button className="btn-primary w-full" onClick={handleAdd}>เพิ่มสินค้า</button>
          </div>
        </Modal>
      )}

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <Modal onClose={() => setShowBulkModal(false)} title={`อัปเดตราคา ${selectedIds.size} รายการ`}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className={`pill flex-1 ${bulkDirection === "up" ? "active" : ""}`} onClick={() => setBulkDirection("up")}>เพิ่มราคา</button>
              <button className={`pill flex-1 ${bulkDirection === "down" ? "active" : ""}`} onClick={() => setBulkDirection("down")}>ลดราคา</button>
            </div>
            <div className="flex gap-2">
              <button className={`pill flex-1 ${bulkMode === "percent" ? "active" : ""}`} onClick={() => setBulkMode("percent")}>เปอร์เซ็นต์ %</button>
              <button className={`pill flex-1 ${bulkMode === "amount" ? "active" : ""}`} onClick={() => setBulkMode("amount")}>จำนวนเงิน ฿</button>
            </div>
            <input
              className="input-field"
              type="number"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder={bulkMode === "percent" ? "เช่น 5" : "เช่น 1000"}
            />
            <button className="btn-primary w-full" onClick={handleBulkEdit}>
              {bulkDirection === "up" ? "เพิ่ม" : "ลด"}ราคา {selectedIds.size} รายการ
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <div className="toast bg-green-500">{toast}</div>}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
