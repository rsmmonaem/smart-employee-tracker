pub mod auth;
pub mod config;
pub mod db;
pub mod routes;

use axum::{routing::get, Router};
use std::net::SocketAddr;
use sqlx::PgPool;

use crate::config::AppConfig;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: AppConfig,
}

#[tokio::main]
async fn main() {
    let config = AppConfig::load();
    let db = db::init_pool(&config.database_url)
        .await
        .expect("Failed to initialize database pool");

    let state = AppState {
        db,
        config: config.clone(),
    };

    let app = Router::new()
        .route("/api/v1/health", get(|| async { "OK" }))
        .nest("/api/v1/admin", routes::tenant_admin::router().layer(axum::middleware::from_fn_with_state(state.clone(), auth::require_auth)))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], config.api_port));
    println!("Server running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
