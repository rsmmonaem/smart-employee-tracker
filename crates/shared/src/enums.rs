use serde::{Deserialize, Serialize};
use sqlx::Type;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "user_role", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserRole {
    SuperAdmin,
    TenantAdmin,
    Employee,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "tenant_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TenantStatus {
    Trial,
    Active,
    Suspended,
    Cancelled,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "tenant_plan", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TenantPlan {
    Basic,
    Pro,
    Enterprise,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "tracking_mode", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TrackingMode {
    Visible,
    Stealth,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "classification", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Classification {
    Productive,
    Neutral,
    Unproductive,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "alert_type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AlertType {
    IdleTooLong,
    LowProductivity,
    AttendanceAnomaly,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "alert_severity", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "match_type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MatchType {
    App,
    Domain,
}
