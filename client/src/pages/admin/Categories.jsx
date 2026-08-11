import { useEffect, useState } from "react";
import api from "../../services/api";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    try {
      const response = await api.get("/admin/categories");

      const data = response.data?.data || response.data;

      setCategories(data.categories || data.items || data || []);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const createCategory = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    setSaving(true);

    try {
      await api.post("/admin/categories", {
        name,
        description,
      });

      setName("");
      setDescription("");

      await loadCategories();
    } catch (error) {
      console.error("Failed to create category", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories((current) =>
        current.filter((category) => category.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete category", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-gray-500">
          Manage service categories.
        </p>
      </div>

      <form
        onSubmit={createCategory}
        className="rounded-xl border bg-white p-6"
      >
        <h2 className="font-semibold">Create Category</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Home Cleaning"
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cleaning related services"
          />
        </div>

        <div className="mt-4">
          <Button type="submit" loading={saving}>
            Add Category
          </Button>
        </div>
      </form>

      {loading ? (
        <Loader />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-4 font-medium">
                    {category.name}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {category.description || "-"}
                  </td>

                  <td className="px-5 py-4">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteCategory(category.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}