# 🤖 Autonomous Auto-Resolution System

## TL;DR

Agent Herald now **automatically resolves contests** when their deadlines pass. No manual intervention required.

```bash
# Test it locally
npm run auto-resolve
```

---

## What It Does

```
Contest Deadline Passes
         ↓
System Detects (every 10 min)
         ↓
Fetches Oracle Data
         ↓
AI Agent Analyzes
         ↓
Signs Decision
         ↓
Submits to Blockchain
         ↓
Contest Resolved ✅
```

**Result**: Fully autonomous prediction market oracle.

---

## Quick Start

### 1. Test Locally

```bash
cd agent-herald-admin

# Run auto-resolve job
npm run auto-resolve

# Or check what needs resolving
npm run auto-resolve:check
```

### 2. Set Up GitHub Actions

1. Add secrets to GitHub (Settings → Secrets → Actions):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESOLVER_PRIVATE_KEY`
   - `RESOLVER_ADDRESS`
   - `CONTEST_ORACLE_ADDRESS`
   - `BASE_MAINNET_RPC`
   - `ADMIN_SIGNER_PRIVATE_KEY`
   - `APP_URL`

2. Push the workflow file (already created):
   ```bash
   git add .github/workflows/autoResolve.yml
   git commit -m "Enable auto-resolution"
   git push
   ```

3. Verify in **Actions** tab

---

## How to Use

### API Endpoints

**Check pending contests:**
```bash
GET /api/jobs/autoResolve
```

**Trigger resolution:**
```bash
POST /api/jobs/autoResolve
```

### NPM Scripts

```bash
# Run auto-resolve locally
npm run auto-resolve

# Check pending contests
npm run auto-resolve:check
```

### GitHub Actions

- **Automatic**: Runs every 10 minutes
- **Manual**: Actions → "Auto Resolve" → Run workflow

---

## Files Created

| File | Purpose |
|------|---------|
| `jobs/autoResolve.ts` | Core logic |
| `app/api/jobs/autoResolve/route.ts` | API endpoint |
| `scripts/runAutoResolve.ts` | Local test script |
| `.github/workflows/autoResolve.yml` | Cron job |

---

## Configuration

### Cron Frequency

Edit `.github/workflows/autoResolve.yml`:

```yaml
schedule:
  - cron: "*/10 * * * *"  # Every 10 minutes
```

### Environment Variables

Required in `.env.local`:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
RESOLVER_PRIVATE_KEY=0x...
RESOLVER_ADDRESS=0x...
CONTEST_ORACLE_ADDRESS=0x...
BASE_MAINNET_RPC=https://mainnet.base.org
APP_URL=http://localhost:3000
```

---

## Verification

### ✅ System is Working When:

1. **GitHub Actions runs successfully**
   - Check: Actions tab → Latest run

2. **Expired contests are resolved**
   - Check database: `status = 'RESOLVED'`

3. **Transactions appear on-chain**
   - Check BaseScan for transactions

4. **Mobile app shows resolved contests**
   - Open app → See resolved status

### ⚠️ Troubleshooting

**No contests resolving?**
- Verify contest deadline has passed
- Check GitHub Actions logs
- Test locally: `npm run auto-resolve`

**Resolution fails?**
- Verify resolver signer is set on-chain
- Check private key is valid
- Ensure gas balance sufficient

---

## Architecture

```
┌─────────────────────┐
│  GitHub Actions     │ Cron every 10 min
│  (Scheduled)        │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  jobs/autoResolve   │ Query expired contests
│                     │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  /api/resolve       │ For each contest
│                     │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Resolver Agent     │ Sign decision
│                     │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Smart Contract     │ Verify & resolve
│                     │
└─────────────────────┘
```

---

## Security

### Best Practices

✅ Use GitHub Secrets (never commit keys)
✅ Rotate resolver keys periodically
✅ Monitor GitHub Actions logs
✅ Set up failure alerts

### Access Control (Optional)

Add authentication to API endpoint:

```typescript
// app/api/jobs/autoResolve/route.ts
const authHeader = req.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## Monitoring

### GitHub Actions Dashboard

**Actions** tab shows:
- Run history
- Success/failure status
- Detailed logs
- Duration

### Database Queries

```sql
-- Pending resolutions
SELECT id, question, deadline
FROM contests
WHERE deadline < NOW() AND status != 'RESOLVED';

-- Recent resolutions
SELECT id, question, status, resolved_outcome
FROM contests
WHERE status = 'RESOLVED'
ORDER BY deadline DESC
LIMIT 10;
```

---

## Documentation

- **📖 Complete Setup**: `AUTO_RESOLVE_SETUP.md`
- **✅ Verification**: `AUTO_RESOLVE_VERIFICATION.md`
- **📊 Summary**: `AUTO_RESOLVE_SUMMARY.md`
- **⚡ Quick Reference**: `AUTO_RESOLVE_QUICKREF.md`

---

## Next Steps

1. ✅ Test locally: `npm run auto-resolve`
2. ✅ Add GitHub secrets
3. ✅ Enable workflow
4. ✅ Monitor first runs
5. 🚀 Let it run autonomously!

---

**🎉 Your autonomous oracle is live!**

No more manual resolution. No more admin overhead. Just pure, automated prediction market magic. ✨
