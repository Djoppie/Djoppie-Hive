# Quick Start Guide - 5 Minutes to Getting Started

**Version**: 1.0  
**Last Updated**: February 2026

---

## Step 1: Access Djoppie-Hive

1. Open your web browser
2. Navigate to: **<https://swa-djoppie-hive-dev-ui.azurestaticapps.net>**
3. Click **"Sign in with Microsoft"**

---

## Step 2: Authenticate

1. Enter your **Gemeente Diepenbeek email** (e.g., <firstname.lastname@diepenbeek.be>)
2. Enter your **password**
3. Complete **Multi-Factor Authentication** if prompted (email or authenticator app)
4. Click **"Sign in"**

---

## Step 3: Understand Your Role

After login, your dashboard reflects your role:

| Role | Access | Features |
|------|--------|----------|
| **HR Admin** | All employees | Full edit, validation, reports |
| **Sector Manager** | Sector employees | Edit sector, approve sector changes |
| **Team Coach** | Department employees | Edit department, approve department changes |
| **Employee** | Self only | View own profile, colleague directory |

---

## Step 4: Main Menu Overview

```
┌─ Dashboard            → KPIs, recent activity, notifications
├─ Personnel           → Employee list, search, filter
├─ Volunteers          → Volunteer management
├─ Distribution Groups → MG-groups and hierarchy
├─ Validation          → Pending approvals
├─ Sync History        → Sync logs and status
├─ My Profile          → Personal settings
└─ Settings            → System config (admin only)
```

---

## Step 5: Common Tasks

### Search for an Employee

1. Click **Personnel** → Employee list opens
2. Use **Search box** to find by name/email
3. Click employee row to view details

### Approve a Change

1. Click **Validation** → Pending requests appear
2. Click request to review changes
3. Click **✅ Approve** or **❌ Reject**
4. Add optional comment, click **Submit**

### Export Employee Data

1. Click **Personnel**
2. Click **⬇ Export** button
3. Select format (CSV or Excel)
4. File downloads to your computer

### Start a Manual Sync

1. Click **Sync History**
2. Click **🔄 Sync Now** button
3. Wait for completion (1-5 minutes)
4. View results

### View Your Role & Permissions

1. Click **Settings** (top right)
2. Select **My Role**
3. See your assigned role and permissions

---

## Quick Reference

### Common Shortcuts

- **Ctrl+K** or **Cmd+K**: Search bar
- **Esc**: Close modals/dialogs
- **?**: Keyboard help (in some views)

### Understanding Data Icons

| Icon | Meaning |
|------|---------|
| ☁️ | Data from Azure AD (read-only) |
| 👤 | Manually added (fully editable) |
| ✅ | Approved/Active |
| ⏳ | Pending validation |
| ❌ | Rejected/Inactive |

---

## Troubleshooting

**"I can't log in"**

- Check email spelling
- Verify Gemeente Diepenbeek domain
- Try resetting password: Click "Can't access your account?"

**"I don't see employees in my sector"**

- Check you have Sector Manager or HR Admin role
- Verify employees are in your assigned sector
- Try refreshing page (F5)

**"Validation request disappeared"**

- It was likely approved by another manager
- Check **Sync History** for confirmation

**"Export didn't work"**

- Try a different browser (Chrome recommended)
- Reduce filters if exporting large datasets
- Contact ICT Support

---

## What's Next?

- **User**: Read [How to Use the System](../02-User-Guide/02-Using-the-System.md)
- **Manager**: Read [Validation Workflow](../02-User-Guide/04-Validation-Workflow.md)
- **Admin**: Read [System Configuration](../03-Admin-Guide/01-System-Configuration.md)
- **Questions?**: See [FAQ](../02-User-Guide/05-FAQ.md)

---

## Support

**Email**: <ict@diepenbeek.be>  
**Phone**: Ask your local ICT support  
**Hours**: Monday-Friday, 08:00-17:00
