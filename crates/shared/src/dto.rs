//! Request and response DTOs shared between the API server and desktop agent.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::enums::{Classification, TrackingMode};

// ── Agent DTOs ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AgentEvent {
    Activity {
        app_name: String,
        window_title: String,
        domain: Option<String>,
        started_at: DateTime<Utc>,
        ended_at: DateTime<Utc>,
        client_timestamp: DateTime<Utc>,
    },
    IdleStart {
        client_timestamp: DateTime<Utc>,
    },
    IdleEnd {
        client_timestamp: DateTime<Utc>,
    },
    ClockIn {
        client_timestamp: DateTime<Utc>,
    },
    ClockOut {
        client_timestamp: DateTime<Utc>,
    },
    BreakStart {
        client_timestamp: DateTime<Utc>,
    },
    BreakEnd {
        client_timestamp: DateTime<Utc>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEventBatch {
    pub events: Vec<AgentEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub tracking_mode: TrackingMode,
    pub screenshot_interval_sec: u32,
    pub idle_threshold_sec: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatRequest {
    pub agent_version: String,
    pub os: String,
    pub ts: DateTime<Utc>,
}

// ── Auth DTOs ───────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSummary {
    pub id: Uuid,
    pub email: String,
    pub full_name: Option<String>,
    pub role: crate::enums::UserRole,
    pub tenant_id: Option<Uuid>,
}

// ── Common response wrappers ─────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub page: u32,
    pub page_size: u32,
    pub total: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub error: String,
    pub message: String,
}

// ── Activity classification result ───────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct ClassifyResult {
    pub classification: Classification,
    pub matched_rule_id: Option<Uuid>,
}
