use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router, Extension
};
use serde_json::json;

use crate::auth::AuthenticatedUser;
use crate::AppState;
use timeguard_shared::models::{User, Team};
use timeguard_shared::enums::UserRole;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/employees", get(list_employees))
        .route("/teams", get(list_teams))
}

async fn list_employees(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if user.role != UserRole::TenantAdmin {
        return Err((StatusCode::FORBIDDEN, Json(json!({"error": "FORBIDDEN"}))));
    }

    let tenant_id = user.tenant_id.ok_or((StatusCode::BAD_REQUEST, Json(json!({"error": "No tenant ID"}))))?;

    let employees = sqlx::query_as!(
        User,
        r#"
        SELECT id, tenant_id, role as "role: UserRole", tracking_mode as "tracking_mode: _", full_name, email, avatar_url, consent_at, is_active, created_at
        FROM users
        WHERE tenant_id = $1 AND role = 'EMPLOYEE'
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    Ok(Json(json!({ "data": employees })))
}

async fn list_teams(
    State(state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if user.role != UserRole::TenantAdmin {
        return Err((StatusCode::FORBIDDEN, Json(json!({"error": "FORBIDDEN"}))));
    }

    let tenant_id = user.tenant_id.ok_or((StatusCode::BAD_REQUEST, Json(json!({"error": "No tenant ID"}))))?;

    let teams = sqlx::query_as!(
        Team,
        "SELECT id, tenant_id, name, description, created_at FROM teams WHERE tenant_id = $1",
        tenant_id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    Ok(Json(json!({ "data": teams })))
}
