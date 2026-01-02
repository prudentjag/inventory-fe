import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import {
  useFacilities,
  useDeleteFacility,
  type FacilityFilters,
} from "../data/facilities";
import type { Facility, FacilityType } from "../types";
import FacilityModal from "../components/modals/FacilityModal";

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  pitch: "Football Pitch",
  event_hall: "Event Hall",
  court: "Court",
  conference_room: "Conference Room",
};

const FACILITY_TYPE_COLORS: Record<FacilityType, string> = {
  pitch: "bg-green-100 text-green-700 border-green-200",
  event_hall: "bg-purple-100 text-purple-700 border-purple-200",
  court: "bg-blue-100 text-blue-700 border-blue-200",
  conference_room: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function FacilitiesPage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<FacilityType | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  const filters: FacilityFilters = {
    type: selectedType || undefined,
  };

  const { data: facilitiesData, isLoading } = useFacilities(filters);
  const deleteFacility = useDeleteFacility();

  const facilities = facilitiesData?.data || [];
  const canManage = ["admin", "manager","stockist"].includes(user?.role || "");

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setIsModalOpen(true);
  };

  const handleDelete = async (facility: Facility) => {
    if (!confirm(`Delete "${facility.name}"?`)) return;
    try {
      await deleteFacility.mutateAsync(facility.id);
      toast.success("Facility deleted");
    } catch {
      toast.error("Failed to delete facility");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFacility(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilities</h1>
          <p className="text-muted-foreground">
            Manage bookable spaces and resources.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Facility
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Filter size={18} />
          <span className="text-sm font-medium">Filter by Type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType("")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              !selectedType
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input hover:bg-accent"
            )}
          >
            All
          </button>
          {(Object.keys(FACILITY_TYPE_LABELS) as FacilityType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                selectedType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-input hover:bg-accent"
              )}
            >
              {FACILITY_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Facilities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-6 animate-pulse"
            >
              <div className="h-6 bg-muted rounded w-3/4 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Facilities Found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedType
              ? `No ${FACILITY_TYPE_LABELS[selectedType]} facilities available.`
              : "Get started by adding your first facility."}
          </p>
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus size={18} />
              Add Facility
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{facility.name}</h3>
                  <span
                    className={cn(
                      "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                      FACILITY_TYPE_COLORS[facility.type]
                    )}
                  >
                    {FACILITY_TYPE_LABELS[facility.type]}
                  </span>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    facility.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {facility.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {facility.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {facility.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {/* <DollarSign size={14} /> */}
                  <span>
                    ₦{Number(facility.hourly_rate).toLocaleString()}/hr
                  </span>
                </div>
                {facility.capacity && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} />
                    <span>Capacity: {facility.capacity}</span>
                  </div>
                )}
              </div>

              {canManage && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => handleEdit(facility)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(facility)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <FacilityModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        facility={editingFacility}
      />
    </div>
  );
}
