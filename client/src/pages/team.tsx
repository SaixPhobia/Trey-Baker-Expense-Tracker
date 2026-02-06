import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Shield, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  Owner: ShieldCheck,
  Manager: Shield,
  Staff: User,
};

const ROLE_COLORS: Record<string, string> = {
  Owner: "bg-primary/10 text-primary",
  Manager: "bg-blue-50 text-blue-700",
  Staff: "bg-gray-100 text-gray-600",
};

export default function TeamPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/team/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Role Updated", description: "Team member's role has been changed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    },
  });

  if (user?.role !== "Owner") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Shield className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-serif">Only the Owner can manage team members.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">Team</h1>
            <p className="text-muted-foreground max-w-2xl">
              Manage your team members and their roles. Owners and Managers can add/delete items, Staff can only view and submit expenses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-serif font-bold text-primary">Owner</h3>
            </div>
            <p className="text-xs text-muted-foreground">Full access. Can manage team, settings, and all data.</p>
          </div>
          <div className="bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <h3 className="font-serif font-bold text-blue-700">Manager</h3>
            </div>
            <p className="text-xs text-muted-foreground">Can add/delete ingredients, menu items, and expenses.</p>
          </div>
          <div className="bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <h3 className="font-serif font-bold text-gray-600">Staff</h3>
            </div>
            <p className="text-xs text-muted-foreground">Can view everything and submit expenses only.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border border-border rounded-none overflow-hidden bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-serif text-primary font-bold">Name</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Username</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Role</TableHead>
                  <TableHead className="font-serif text-primary font-bold w-[200px]">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No team members yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => {
                    const RoleIcon = ROLE_ICONS[member.role] || User;
                    const isSelf = member.id === user?.id;
                    return (
                      <TableRow key={member.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-team-${member.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-xs">
                              {member.displayName.split(" ").map(n => n[0]).join("")}
                            </div>
                            {member.displayName}
                            {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">@{member.username}</TableCell>
                        <TableCell>
                          <Badge className={cn("rounded-none border-none px-2 py-0.5 text-[10px] uppercase tracking-wider", ROLE_COLORS[member.role] || "bg-gray-100")}>
                            <RoleIcon className="mr-1 h-3 w-3 inline" />
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isSelf ? (
                            <span className="text-xs text-muted-foreground italic">Can't change own role</span>
                          ) : (
                            <Select
                              value={member.role}
                              onValueChange={(role) => updateRoleMutation.mutate({ id: member.id, role })}
                            >
                              <SelectTrigger className="rounded-none border-muted h-8 text-xs w-[140px]" data-testid={`select-role-${member.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-none">
                                <SelectItem value="Owner">Owner</SelectItem>
                                <SelectItem value="Manager">Manager</SelectItem>
                                <SelectItem value="Staff">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}
