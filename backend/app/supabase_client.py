import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import execute_values, Json
import httpx

from backend.app.config import (
    DATABASE_URL,
    SUPABASE_URL,
    SUPABASE_KEY,
    SUPABASE_ENABLED
)

logger = logging.getLogger("LexiconSupabase")
logger.setLevel(logging.INFO)

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS public.enterprises (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    archetype VARCHAR(100),
    total_accounts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts (
    id VARCHAR(64) PRIMARY KEY,
    enterprise_id VARCHAR(128) REFERENCES public.enterprises(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    department VARCHAR(255),
    role VARCHAR(255),
    is_privileged BOOLEAN DEFAULT FALSE,
    password_group_id VARCHAR(128),
    plaintext_password TEXT,
    hash_ntlm TEXT,
    hash_md5 TEXT,
    hash_sha256 TEXT,
    hash_bcrypt TEXT,
    hash_argon2id TEXT,
    policy_violations JSONB DEFAULT '[]'::jsonb,
    zxcvbn_score INT DEFAULT 0,
    breach_match BOOLEAN DEFAULT FALSE,
    baseline_risk NUMERIC(5,2) DEFAULT 0.0,
    baseline_tier VARCHAR(32) DEFAULT 'Low',
    attack_adjustment NUMERIC(5,2) DEFAULT 0.0,
    final_risk NUMERIC(5,2) DEFAULT 0.0,
    final_tier VARCHAR(32) DEFAULT 'Low',
    is_hero BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    blocked_at TIMESTAMPTZ,
    last_remediated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_summaries (
    id VARCHAR(128) PRIMARY KEY,
    enterprise_id VARCHAR(128) REFERENCES public.enterprises(id) ON DELETE CASCADE,
    total_accounts INT DEFAULT 0,
    critical_count INT DEFAULT 0,
    high_risk_count INT DEFAULT 0,
    medium_risk_count INT DEFAULT 0,
    low_risk_count INT DEFAULT 0,
    breached_count INT DEFAULT 0,
    reuse_cluster_count INT DEFAULT 0,
    total_reused_accounts INT DEFAULT 0,
    privileged_count INT DEFAULT 0,
    privileged_at_risk_count INT DEFAULT 0,
    policy_violations_count INT DEFAULT 0,
    risk_distribution JSONB DEFAULT '{}'::jsonb,
    department_risk_summary JSONB DEFAULT '{}'::jsonb,
    top_reuse_clusters JSONB DEFAULT '[]'::jsonb,
    hero_account_id VARCHAR(64),
    organization_health JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    enterprise_id VARCHAR(128),
    action VARCHAR(255) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    target_account_id VARCHAR(64),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_enterprise ON public.accounts(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_accounts_username ON public.accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_tier ON public.accounts(final_tier);
CREATE INDEX IF NOT EXISTS idx_accounts_blocked ON public.accounts(is_blocked);
CREATE INDEX IF NOT EXISTS idx_audit_logs_enterprise ON public.audit_logs(enterprise_id);
"""

class SupabaseService:
    def __init__(self):
        self.database_url = DATABASE_URL
        self.url = SUPABASE_URL.rstrip("/") if SUPABASE_URL else ""
        self.key = SUPABASE_KEY
        self.enabled = bool(SUPABASE_ENABLED and (self.database_url or (self.url and self.key)))
        self._schema_initialized = False

    def _get_db_connection(self):
        if not self.database_url:
            raise ValueError("DATABASE_URL is not configured")
        return psycopg2.connect(
            self.database_url,
            connect_timeout=15,
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5
        )

    def init_schema(self) -> bool:
        """Creates the necessary tables and indexes in Supabase PostgreSQL if they do not exist."""
        if not self.enabled or not self.database_url:
            return False
        try:
            with self._get_db_connection() as conn:
                conn.autocommit = True
                with conn.cursor() as cur:
                    cur.execute(SCHEMA_SQL)
            self._schema_initialized = True
            logger.info("Supabase database schema verified and initialized.")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Supabase schema: {e}")
            return False

    def is_connected(self) -> bool:
        if not self.enabled:
            return False
        try:
            if self.database_url:
                with self._get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT 1;")
                        return cur.fetchone()[0] == 1
            elif self.url and self.key:
                with httpx.Client(timeout=10.0, headers={"apikey": self.key, "Authorization": f"Bearer {self.key}"}) as client:
                    res = client.get(f"{self.url}/rest/v1/enterprises?select=id&limit=1")
                    return res.status_code == 200
        except Exception as e:
            logger.warning(f"Supabase connection check failed: {e}")
        return False

    def replace_all_data(
        self,
        accounts: List[Dict[str, Any]],
        metadata: Dict[str, Any],
        audit_summary: Dict[str, Any],
        enterprise_id: str = "lexicon-corp",
        enterprise_name: str = "Lexicon Enterprise Systems",
        domain: str = "lexicon.corp",
        archetype: str = "Fortune 500 Enterprise"
    ) -> Dict[str, Any]:
        """
        Deletes ALL existing data in the Supabase PostgreSQL database
        and replaces it with the newly generated dataset, enterprise, summary, and audit log.
        """
        if not self.enabled:
            return {"status": "skipped", "message": "Supabase integration is disabled"}

        if not self._schema_initialized:
            self.init_schema()

        if not self.database_url:
            return {"status": "error", "message": "DATABASE_URL not configured for full data replace"}

        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            total_accs = len(accounts)

            with self._get_db_connection() as conn:
                conn.autocommit = False
                with conn.cursor() as cur:
                    # 1. Truncate all tables for a completely clean slate
                    cur.execute("TRUNCATE TABLE public.accounts, public.audit_summaries, public.audit_logs, public.enterprises CASCADE;")

                    # 2. Insert new enterprise
                    cur.execute(
                        """
                        INSERT INTO public.enterprises (id, name, domain, archetype, total_accounts, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (enterprise_id, enterprise_name, domain, archetype, total_accs, now_iso, now_iso)
                    )

                    # 3. Batch insert all accounts using execute_values for high throughput
                    account_records = []
                    for a in accounts:
                        account_records.append((
                            str(a.get("id")),
                            enterprise_id,
                            str(a.get("username", "")),
                            str(a.get("first_name", "")),
                            str(a.get("last_name", "")),
                            str(a.get("email", "")),
                            str(a.get("department", "Corporate")),
                            str(a.get("role", "Staff")),
                            bool(a.get("is_privileged", False)),
                            str(a.get("password_group_id", "") or ""),
                            str(a.get("plaintext_password", "")),
                            str(a.get("hash_ntlm", "")),
                            str(a.get("hash_md5", "")),
                            str(a.get("hash_sha256", "")),
                            str(a.get("hash_bcrypt", "")),
                            str(a.get("hash_argon2id", "")),
                            Json(a.get("policy_violations", [])),
                            int(a.get("zxcvbn_score", 0)),
                            bool(a.get("breach_match", False)),
                            float(a.get("baseline_risk", 0.0)),
                            str(a.get("baseline_tier", "Low")),
                            float(a.get("attack_adjustment", 0.0)),
                            float(a.get("final_risk", 0.0)),
                            str(a.get("final_tier", "Low")),
                            bool(a.get("is_hero", False)),
                            bool(a.get("is_blocked", False)),
                            a.get("blocked_reason"),
                            a.get("blocked_at"),
                            a.get("last_remediated_at"),
                            now_iso
                        ))

                    insert_accounts_sql = """
                        INSERT INTO public.accounts (
                            id, enterprise_id, username, first_name, last_name, email,
                            department, role, is_privileged, password_group_id, plaintext_password,
                            hash_ntlm, hash_md5, hash_sha256, hash_bcrypt, hash_argon2id,
                            policy_violations, zxcvbn_score, breach_match, baseline_risk,
                            baseline_tier, attack_adjustment, final_risk, final_tier,
                            is_hero, is_blocked, blocked_reason, blocked_at, last_remediated_at,
                            updated_at
                        ) VALUES %s
                    """
                    execute_values(cur, insert_accounts_sql, account_records, page_size=5000)

                    # 4. Insert Audit Summary
                    cur.execute(
                        """
                        INSERT INTO public.audit_summaries (
                            id, enterprise_id, total_accounts, critical_count, high_risk_count,
                            medium_risk_count, low_risk_count, breached_count, reuse_cluster_count,
                            total_reused_accounts, privileged_count, privileged_at_risk_count,
                            policy_violations_count, risk_distribution, department_risk_summary,
                            top_reuse_clusters, hero_account_id, organization_health, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s,
                            %s, %s, %s,
                            %s, %s, %s, %s
                        )
                        """,
                        (
                            f"{enterprise_id}-summary",
                            enterprise_id,
                            audit_summary.get("total_accounts", total_accs),
                            audit_summary.get("critical_count", 0),
                            audit_summary.get("high_risk_count", 0),
                            audit_summary.get("medium_risk_count", 0),
                            audit_summary.get("low_risk_count", 0),
                            audit_summary.get("breached_count", 0),
                            audit_summary.get("reuse_cluster_count", 0),
                            audit_summary.get("total_reused_accounts", 0),
                            audit_summary.get("privileged_count", 0),
                            audit_summary.get("privileged_at_risk_count", 0),
                            audit_summary.get("policy_violations_count", 0),
                            Json(audit_summary.get("risk_distribution", {})),
                            Json(audit_summary.get("department_risk_summary", {})),
                            Json(audit_summary.get("top_reuse_clusters", [])),
                            audit_summary.get("hero_account_id", "ACC-00042"),
                            Json(audit_summary.get("organization_health", {})),
                            now_iso
                        )
                    )

                    # 5. Insert initial audit log
                    cur.execute(
                        """
                        INSERT INTO public.audit_logs (enterprise_id, action, actor, details, created_at)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            enterprise_id,
                            "DATASET_GENERATED_AND_REPLACED",
                            "System Generator",
                            Json({
                                "total_accounts": total_accs,
                                "enterprise_name": enterprise_name,
                                "metadata": metadata
                            }),
                            now_iso
                        )
                    )

                    conn.commit()

            logger.info(f"Supabase DB successfully replaced with {total_accs:,} accounts for {enterprise_name}.")
            return {
                "status": "success",
                "synced_accounts": total_accs,
                "enterprise_id": enterprise_id,
                "timestamp": now_iso
            }
        except Exception as e:
            logger.error(f"Failed to replace Supabase data: {e}")
            return {"status": "error", "message": str(e)}

    def _ensure_enterprise(self, cur, enterprise_id: str = "lexicon-corp", name: str = "Lexicon Enterprise Systems", domain: str = "lexicon.corp", archetype: str = "Fortune 500 Enterprise") -> str:
        """Ensures an enterprise row exists, creating one if not present, and returns the valid enterprise_id."""
        cur.execute("SELECT id FROM public.enterprises LIMIT 1;")
        row = cur.fetchone()
        if row:
            return row[0]
        
        now_iso = datetime.now(timezone.utc).isoformat()
        cur.execute(
            """
            INSERT INTO public.enterprises (id, name, domain, archetype, total_accounts, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
            """,
            (enterprise_id, name, domain, archetype, 0, now_iso, now_iso)
        )
        return enterprise_id

    def sync_accounts_batch(self, accounts: List[Dict[str, Any]], enterprise_id: str = "lexicon-corp", batch_size: int = 2000) -> int:
        """Upserts a batch of accounts to Supabase PostgreSQL."""
        if not self.enabled or not accounts:
            return 0

        if not self._schema_initialized:
            self.init_schema()

        if self.database_url:
            try:
                now_iso = datetime.now(timezone.utc).isoformat()
                records = []
                for a in accounts:
                    records.append((
                        str(a.get("id")),
                        enterprise_id,
                        str(a.get("username", "")),
                        str(a.get("first_name", "")),
                        str(a.get("last_name", "")),
                        str(a.get("email", "")),
                        str(a.get("department", "Corporate")),
                        str(a.get("role", "Staff")),
                        bool(a.get("is_privileged", False)),
                        str(a.get("password_group_id", "") or ""),
                        str(a.get("plaintext_password", "")),
                        str(a.get("hash_ntlm", "")),
                        str(a.get("hash_md5", "")),
                        str(a.get("hash_sha256", "")),
                        str(a.get("hash_bcrypt", "")),
                        str(a.get("hash_argon2id", "")),
                        Json(a.get("policy_violations", [])),
                        int(a.get("zxcvbn_score", 0)),
                        bool(a.get("breach_match", False)),
                        float(a.get("baseline_risk", 0.0)),
                        str(a.get("baseline_tier", "Low")),
                        float(a.get("attack_adjustment", 0.0)),
                        float(a.get("final_risk", 0.0)),
                        str(a.get("final_tier", "Low")),
                        bool(a.get("is_hero", False)),
                        bool(a.get("is_blocked", False)),
                        a.get("blocked_reason"),
                        a.get("blocked_at"),
                        a.get("last_remediated_at"),
                        now_iso
                    ))

                sql = """
                    INSERT INTO public.accounts (
                        id, enterprise_id, username, first_name, last_name, email,
                        department, role, is_privileged, password_group_id, plaintext_password,
                        hash_ntlm, hash_md5, hash_sha256, hash_bcrypt, hash_argon2id,
                        policy_violations, zxcvbn_score, breach_match, baseline_risk,
                        baseline_tier, attack_adjustment, final_risk, final_tier,
                        is_hero, is_blocked, blocked_reason, blocked_at, last_remediated_at,
                        updated_at
                    ) VALUES %s
                    ON CONFLICT (id) DO UPDATE SET
                        username = EXCLUDED.username,
                        department = EXCLUDED.department,
                        role = EXCLUDED.role,
                        is_privileged = EXCLUDED.is_privileged,
                        plaintext_password = EXCLUDED.plaintext_password,
                        hash_ntlm = EXCLUDED.hash_ntlm,
                        hash_md5 = EXCLUDED.hash_md5,
                        hash_sha256 = EXCLUDED.hash_sha256,
                        hash_bcrypt = EXCLUDED.hash_bcrypt,
                        hash_argon2id = EXCLUDED.hash_argon2id,
                        policy_violations = EXCLUDED.policy_violations,
                        zxcvbn_score = EXCLUDED.zxcvbn_score,
                        breach_match = EXCLUDED.breach_match,
                        baseline_risk = EXCLUDED.baseline_risk,
                        baseline_tier = EXCLUDED.baseline_tier,
                        attack_adjustment = EXCLUDED.attack_adjustment,
                        final_risk = EXCLUDED.final_risk,
                        final_tier = EXCLUDED.final_tier,
                        is_hero = EXCLUDED.is_hero,
                        is_blocked = EXCLUDED.is_blocked,
                        blocked_reason = EXCLUDED.blocked_reason,
                        blocked_at = EXCLUDED.blocked_at,
                        last_remediated_at = EXCLUDED.last_remediated_at,
                        updated_at = EXCLUDED.updated_at
                """
                with self._get_db_connection() as conn:
                    conn.autocommit = True
                    with conn.cursor() as cur:
                        ent_id = self._ensure_enterprise(cur, enterprise_id)
                        valid_records = [
                            (r[0], ent_id, *r[2:]) for r in records
                        ]
                        execute_values(cur, sql, valid_records, page_size=batch_size)
                return len(records)
            except Exception as e:
                logger.error(f"PostgreSQL batch sync failed: {e}")
                return 0
        return 0

    def update_account(self, account_id: str, updates: Dict[str, Any]) -> bool:
        """Updates an individual account in Supabase."""
        if not self.enabled:
            return False

        now_iso = datetime.now(timezone.utc).isoformat()
        if self.database_url:
            try:
                set_clauses = []
                values = []
                for k, v in updates.items():
                    set_clauses.append(f"{k} = %s")
                    if isinstance(v, (dict, list)):
                        values.append(Json(v))
                    else:
                        values.append(v)
                set_clauses.append("updated_at = %s")
                values.append(now_iso)
                values.append(account_id)

                sql = f"UPDATE public.accounts SET {', '.join(set_clauses)} WHERE id = %s"
                with self._get_db_connection() as conn:
                    conn.autocommit = True
                    with conn.cursor() as cur:
                        cur.execute(sql, tuple(values))
                        return cur.rowcount > 0
            except Exception as e:
                logger.error(f"PostgreSQL update_account failed for {account_id}: {e}")
                return False
        return False

    def bulk_block_sensitive(self, enterprise_id: str = "lexicon-corp", reason: str = "Auditor Bulk Sensitive Lockdown") -> int:
        """Bulk updates all Critical and Breached accounts to is_blocked=true in Supabase."""
        if not self.enabled:
            return 0

        now_iso = datetime.now(timezone.utc).isoformat()
        if self.database_url:
            try:
                sql = """
                    UPDATE public.accounts
                    SET is_blocked = TRUE,
                        blocked_reason = %s,
                        blocked_at = %s,
                        updated_at = %s
                    WHERE enterprise_id = %s
                      AND (final_tier = 'Critical' OR breach_match = TRUE)
                """
                with self._get_db_connection() as conn:
                    conn.autocommit = True
                    with conn.cursor() as cur:
                        ent_id = self._ensure_enterprise(cur, enterprise_id)
                        cur.execute(sql, (reason, now_iso, now_iso, ent_id))
                        return cur.rowcount
            except Exception as e:
                logger.error(f"PostgreSQL bulk_block_sensitive failed: {e}")
                return 0
        return 0

    def sync_audit_summary(self, summary: Dict[str, Any], enterprise_id: str = "lexicon-corp") -> bool:
        """Upserts the enterprise audit summary in Supabase."""
        if not self.enabled:
            return False

        now_iso = datetime.now(timezone.utc).isoformat()
        if self.database_url:
            try:
                sql = """
                    INSERT INTO public.audit_summaries (
                        id, enterprise_id, total_accounts, critical_count, high_risk_count,
                        medium_risk_count, low_risk_count, breached_count, reuse_cluster_count,
                        total_reused_accounts, privileged_count, privileged_at_risk_count,
                        policy_violations_count, risk_distribution, department_risk_summary,
                        top_reuse_clusters, hero_account_id, organization_health, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, %s, %s
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        total_accounts = EXCLUDED.total_accounts,
                        critical_count = EXCLUDED.critical_count,
                        high_risk_count = EXCLUDED.high_risk_count,
                        medium_risk_count = EXCLUDED.medium_risk_count,
                        low_risk_count = EXCLUDED.low_risk_count,
                        breached_count = EXCLUDED.breached_count,
                        reuse_cluster_count = EXCLUDED.reuse_cluster_count,
                        total_reused_accounts = EXCLUDED.total_reused_accounts,
                        privileged_count = EXCLUDED.privileged_count,
                        privileged_at_risk_count = EXCLUDED.privileged_at_risk_count,
                        policy_violations_count = EXCLUDED.policy_violations_count,
                        risk_distribution = EXCLUDED.risk_distribution,
                        department_risk_summary = EXCLUDED.department_risk_summary,
                        top_reuse_clusters = EXCLUDED.top_reuse_clusters,
                        hero_account_id = EXCLUDED.hero_account_id,
                        organization_health = EXCLUDED.organization_health,
                        updated_at = EXCLUDED.updated_at
                """
                with self._get_db_connection() as conn:
                    conn.autocommit = True
                    with conn.cursor() as cur:
                        ent_id = self._ensure_enterprise(cur, enterprise_id)
                        cur.execute(sql, (
                            f"{ent_id}-summary",
                            ent_id,
                            summary.get("total_accounts", 0),
                            summary.get("critical_count", 0),
                            summary.get("high_risk_count", 0),
                            summary.get("medium_risk_count", 0),
                            summary.get("low_risk_count", 0),
                            summary.get("breached_count", 0),
                            summary.get("reuse_cluster_count", 0),
                            summary.get("total_reused_accounts", 0),
                            summary.get("privileged_count", 0),
                            summary.get("privileged_at_risk_count", 0),
                            summary.get("policy_violations_count", 0),
                            Json(summary.get("risk_distribution", {})),
                            Json(summary.get("department_risk_summary", {})),
                            Json(summary.get("top_reuse_clusters", [])),
                            summary.get("hero_account_id", "ACC-00042"),
                            Json(summary.get("organization_health", {})),
                            now_iso
                        ))
                return True
            except Exception as e:
                logger.error(f"PostgreSQL sync_audit_summary failed: {e}")
                return False
        return False

    def log_audit_action(self, action: str, actor: str = "Auditor", target_account_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None, enterprise_id: str = "lexicon-corp") -> bool:
        """Inserts an immutable audit event into Supabase audit_logs."""
        if not self.enabled:
            return False

        now_iso = datetime.now(timezone.utc).isoformat()
        if self.database_url:
            try:
                sql = """
                    INSERT INTO public.audit_logs (enterprise_id, action, actor, target_account_id, details, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                with self._get_db_connection() as conn:
                    conn.autocommit = True
                    with conn.cursor() as cur:
                        cur.execute(sql, (
                            enterprise_id,
                            action,
                            actor,
                            target_account_id,
                            Json(details or {}),
                            now_iso
                        ))
                return True
            except Exception as e:
                logger.warning(f"PostgreSQL audit log insert failed: {e}")
                return False
        return False

    def fetch_audit_logs(self, limit: int = 50, enterprise_id: str = "lexicon-corp") -> List[Dict[str, Any]]:
        """Retrieves real-time audit logs from Supabase."""
        if not self.enabled or not self.database_url:
            return []

        try:
            sql = """
                SELECT id, enterprise_id, action, actor, target_account_id, details, created_at
                FROM public.audit_logs
                WHERE enterprise_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """
            with self._get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (enterprise_id, limit))
                    rows = cur.fetchall()
                    result = []
                    for r in rows:
                        result.append({
                            "id": r[0],
                            "enterprise_id": r[1],
                            "action": r[2],
                            "actor": r[3],
                            "target_account_id": r[4],
                            "details": r[5] if isinstance(r[5], dict) else json.loads(r[5]) if r[5] else {},
                            "created_at": r[6].isoformat() if hasattr(r[6], "isoformat") else str(r[6])
                        })
                    return result
        except Exception as e:
            logger.warning(f"Failed to fetch audit logs: {e}")
        return []

    def get_database_status(self) -> Dict[str, Any]:
        """Returns connection health and counts from Supabase PostgreSQL."""
        if not self.enabled or not self.database_url:
            return {
                "connected": False,
                "database": "postgresql://aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
                "error": "Database disabled or URL missing"
            }

        try:
            with self._get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT COUNT(*) FROM public.enterprises;")
                    enterprise_count = cur.fetchone()[0]

                    cur.execute("SELECT COUNT(*), COUNT(CASE WHEN is_blocked THEN 1 END) FROM public.accounts;")
                    row = cur.fetchone()
                    total_accounts = row[0] if row else 0
                    blocked_accounts = row[1] if row else 0

                    cur.execute("SELECT COUNT(*) FROM public.audit_logs;")
                    audit_logs_count = cur.fetchone()[0]

            return {
                "connected": True,
                "provider": "Supabase Cloud PostgreSQL",
                "url": self.url,
                "database_host": "aws-0-ap-northeast-1.pooler.supabase.com",
                "project_ref": "chqamrjacglwcxnoeamh",
                "enterprise_count": enterprise_count,
                "total_accounts": total_accounts,
                "blocked_accounts": blocked_accounts,
                "audit_logs_count": audit_logs_count,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            return {
                "connected": False,
                "provider": "Supabase Cloud PostgreSQL",
                "url": self.url,
                "database_host": "aws-0-ap-northeast-1.pooler.supabase.com",
                "project_ref": "chqamrjacglwcxnoeamh",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Singleton instance
supabase_service = SupabaseService()

