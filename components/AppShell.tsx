"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth/types";
import Link from "./Link";

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_MINI = 72;

type DesktopNavState = "expanded" | "mini" | "hidden";

const navItems = [
  { label: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { label: "Scripts", href: "/scripts", icon: <DescriptionIcon /> },
  { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
] as const;

function NavList({
  onNavigate,
  mini = false,
}: {
  onNavigate?: () => void;
  mini?: boolean;
}) {
  const pathname = usePathname();

  return (
    <List>
      {navItems.map((item) => {
        const selected =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        const button = (
          <ListItemButton
            component={Link}
            href={item.href}
            selected={selected}
            onClick={onNavigate}
            sx={{
              minHeight: 48,
              justifyContent: mini ? "center" : "flex-start",
              px: mini ? 1.5 : 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: mini ? 0 : 2,
                justifyContent: "center",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                opacity: mini ? 0 : 1,
                width: mini ? 0 : "auto",
                overflow: "hidden",
                whiteSpace: "nowrap",
                transition: (theme) =>
                  theme.transitions.create(["opacity", "width"], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
              }}
            />
          </ListItemButton>
        );

        return (
          <ListItem key={item.href} disablePadding sx={{ display: "block" }}>
            {mini ? (
              <Tooltip title={item.label} placement="right">
                {button}
              </Tooltip>
            ) : (
              button
            )}
          </ListItem>
        );
      })}
    </List>
  );
}

function DrawerHeader({
  mini = false,
  onCollapse,
  onExpand,
}: {
  mini?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
}) {
  return (
    <>
      <Toolbar
        sx={{
          px: mini ? 1 : 2,
          display: "flex",
          alignItems: "center",
          justifyContent: mini ? "center" : "space-between",
          gap: 1,
        }}
      >
        {!mini ? (
          <Typography variant="h6" noWrap component="div">
            PressScript
          </Typography>
        ) : null}
        {mini && onExpand ? (
          <IconButton
            aria-label="expand navigation"
            onClick={onExpand}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
        ) : null}
        {!mini && onCollapse ? (
          <IconButton
            aria-label="collapse navigation"
            edge="end"
            onClick={onCollapse}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
        ) : null}
      </Toolbar>
      <Divider />
    </>
  );
}

function getDesktopDrawerWidth(state: DesktopNavState) {
  if (state === "expanded") return DRAWER_WIDTH;
  if (state === "mini") return DRAWER_WIDTH_MINI;
  return 0;
}

function DrawerFooter({
  user,
  mini = false,
}: {
  user: AuthUser | null;
  mini?: boolean;
}) {
  return (
    <Box>
      <Divider />
      {!mini && user ? (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" noWrap>
            {user.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.role}
          </Typography>
        </Box>
      ) : null}
      <List>
        <ListItem disablePadding sx={{ display: "block" }}>
          {mini ? (
            <Tooltip title="Sign out" placement="right">
              <ListItemButton
                onClick={() => {
                  void logout();
                }}
                sx={{
                  minHeight: 48,
                  justifyContent: "center",
                  px: 1.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: "center",
                  }}
                >
                  <LogoutIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          ) : (
            <ListItemButton
              onClick={() => {
                void logout();
              }}
              sx={{ minHeight: 48, px: 2.5 }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </ListItemButton>
          )}
        </ListItem>
      </List>
    </Box>
  );
}

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthUser | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopNav, setDesktopNav] = useState<DesktopNavState>("expanded");

  const desktopOpen = desktopNav !== "hidden";
  const desktopMini = desktopNav === "mini";
  const desktopWidth = getDesktopDrawerWidth(desktopNav);

  const handleMobileToggle = () => {
    setMobileOpen((open) => !open);
  };

  const handleMobileNavigate = () => {
    setMobileOpen(false);
  };

  const collapseDesktopNav = () => {
    setDesktopNav((state) => {
      if (state === "expanded") return "mini";
      if (state === "mini") return "hidden";
      return state;
    });
  };

  const expandDesktopNav = () => {
    setDesktopNav((state) => {
      if (state === "hidden") return "mini";
      if (state === "mini") return "expanded";
      return state;
    });
  };

  const openDesktopNav = () => {
    setDesktopNav("expanded");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100%" }}>
      <Box
        component="nav"
        sx={{
          width: { md: desktopWidth },
          flexShrink: { md: 0 },
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleMobileToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <DrawerHeader onCollapse={handleMobileToggle} />
          <NavList onNavigate={handleMobileNavigate} />
          <Box sx={{ mt: "auto" }}>
            <DrawerFooter user={user} />
          </Box>
        </Drawer>

        <Drawer
          variant="permanent"
          open={desktopOpen}
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: desktopWidth,
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
              transition: (theme) =>
                theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              visibility: desktopOpen ? "visible" : "hidden",
            },
          }}
        >
          <DrawerHeader
            mini={desktopMini}
            onCollapse={collapseDesktopNav}
            onExpand={expandDesktopNav}
          />
          <NavList mini={desktopMini} />
          <Box sx={{ mt: "auto" }}>
            {desktopMini ? (
              <>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                  <Tooltip title="Hide navigation" placement="right">
                    <IconButton
                      aria-label="hide navigation"
                      onClick={collapseDesktopNav}
                      size="small"
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : null}
            <DrawerFooter user={user} mini={desktopMini} />
          </Box>
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            md: desktopOpen ? `calc(100% - ${desktopWidth}px)` : "100%",
          },
          minHeight: "100%",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Toolbar
          sx={{
            display: {
              xs: "flex",
              md: desktopOpen ? "none" : "flex",
            },
            px: 1,
            gap: 1,
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open navigation"
            edge="start"
            onClick={handleMobileToggle}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open navigation"
            edge="start"
            onClick={openDesktopNav}
            sx={{ display: { xs: "none", md: "inline-flex" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            PressScript
          </Typography>
        </Toolbar>
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
