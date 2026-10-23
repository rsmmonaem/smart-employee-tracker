use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::AppState;
use timeguard_shared::enums::UserRole;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,        // User ID
    pub role: String,     // Role string, e.g. "authenticated" or custom
    pub exp: usize,
    pub user_role: Option<String>, 
    pub app_metadata: Option<AppMetadata>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppMetadata {
    pub tenant_id: Option<Uuid>,
    pub role: Option<UserRole>,
}

#[derive(Clone)]
pub struct AuthenticatedUser {
    pub user_id: Uuid,
    pub tenant_id: Option<Uuid>,
    pub role: UserRole,
}

pub async fn require_auth(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_audience(&["authenticated"]);

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
        &validation,
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let app_meta = token_data.claims.app_metadata.unwrap_or(AppMetadata {
        tenant_id: None,
        role: None,
    });

    let role = app_meta.role.unwrap_or(UserRole::Employee);

    let auth_user = AuthenticatedUser {
        user_id: token_data.claims.sub,
        tenant_id: app_meta.tenant_id,
        role,
    };

    req.extensions_mut().insert(auth_user);
    Ok(next.run(req).await)
}
