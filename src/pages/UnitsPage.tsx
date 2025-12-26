import { useState } from "react";
import { Plus, MapPin, Building2 } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useUnits } from "../data/units";
import { useUsers } from "../data/staff";
import { UnitModal } from "../components/modals/UnitModal";
import { AssignStaffModal } from "../components/modals/AssignStaffModal";
import type { Unit } from "../types";

export function UnitsPage() {
    const { data: units, isLoading } = useUnits();
    const { data: apiUsers } = useUsers();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    const users = apiUsers?.data || [];

    const handleAssignStaff = (unit: Unit) => {
        setSelectedUnit(unit);
        setIsAssignDialogOpen(true);
    };

    const handleCloseAssignDialog = () => {
        setIsAssignDialogOpen(false);
        setSelectedUnit(null);
    };

    const getAssignedUsers = (unitId: string) => {
        return users.filter(u => u.assigned_unit_id === unitId);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Units</h1>
                    <p className="text-muted-foreground">Manage your business units and locations.</p>
                </div>

                <button
                    onClick={() => setIsDialogOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Unit
                </button>
                <UnitModal
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                />
                <AssignStaffModal
                    isOpen={isAssignDialogOpen}
                    onClose={handleCloseAssignDialog}
                    unit={selectedUnit}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))
                ) : units?.length === 0 ? (
                    <div className="col-span-full text-center py-12 border rounded-lg bg-muted/10">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">No units found</h3>
                        <p className="text-muted-foreground">Get started by creating your first unit.</p>
                    </div>
                ) : (
                    units?.map((unit) => (
                        <div key={unit.id} className="rounded-xl border bg-card text-card-foreground shadow-sm">
                            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">{unit.type}</h3>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="p-6 pt-0">
                                <div className="text-2xl font-bold">{unit.name}</div>
                                {unit.address && (
                                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                                        <MapPin className="mr-1 h-3 w-3" />
                                        {unit.address}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 p-4 border-t border-border">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">Staff ({getAssignedUsers(unit.id).length})</h4>
                                    <button
                                        onClick={() => handleAssignStaff(unit)}
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        + Assign
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {getAssignedUsers(unit.id).length > 0 ? (
                                        getAssignedUsers(unit.id).map(user => (
                                            <span key={user.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                                {user.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">No staff assigned</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
}
