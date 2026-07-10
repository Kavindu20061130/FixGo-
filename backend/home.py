from flask import Blueprint, render_template, flash, redirect, url_for
from flask_login import login_required, current_user
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func

from db.database import engine, User, Worker, Booking, Review, AuditLog

home_bp = Blueprint("home", __name__)

# One sessionmaker bound to the shared engine from database.py
Session = sessionmaker(bind=engine)

# The 4 stages a booking moves through — used to build the real
# "Project / Job Pipeline" progress bars instead of fake percentages.
BOOKING_STAGES = ("requested", "accepted", "in_progress", "completed")


def get_dashboard_stats():
    """
    Pull real, live numbers from the FixGo AI database for the dashboard.
    Every value here is derived from actual rows — nothing is hardcoded.
    """
    session = Session()
    try:
        # --- Top stat cards ---
        jobs_completed = (
            session.query(Booking).filter(Booking.status == "completed").count()
        )

        active_workers = (
            session.query(Worker)
            .filter(Worker.is_active.is_(True), Worker.is_verified == 1)
            .count()
        )

        active_users = session.query(User).filter(User.is_active.is_(True)).count()

        # Prefer real customer reviews for the rating; fall back to worker
        # self-ratings only if no reviews exist yet (so a brand-new platform
        # doesn't show a misleading 0.0).
        avg_rating = session.query(func.avg(Review.rating)).scalar()
        if avg_rating is None:
            avg_rating = (
                session.query(func.avg(Worker.rating))
                .filter(Worker.rating > 0)
                .scalar()
            )
        avg_rating = round(avg_rating, 1) if avg_rating else 0.0

        # --- Job pipeline progress bars (real booking status breakdown) ---
        status_counts = {
            stage: session.query(Booking).filter(Booking.status == stage).count()
            for stage in BOOKING_STAGES
        }
        total_bookings = sum(status_counts.values())
        progress = {
            stage: round((count / total_bookings) * 100) if total_bookings else 0
            for stage, count in status_counts.items()
        }

        # --- Recent activity feed (real audit log entries) ---
        recent_logs = (
            session.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(5)
            .all()
        )
        recent_activity = [
            {
                "action": log.action,
                "details": log.details,
                "created_at": log.created_at.strftime("%b %d, %I:%M %p")
                if log.created_at
                else "",
            }
            for log in recent_logs
        ]

        return {
            "jobs_completed": jobs_completed,
            "active_workers": active_workers,
            "active_users": active_users,
            "avg_rating": avg_rating,
            "total_bookings": total_bookings,
            "progress": progress,
            "recent_activity": recent_activity,
        }
    finally:
        session.close()


@home_bp.route("/dashboard")
@login_required
def dashboard():
    user_name = getattr(current_user, "full_name", "Guest")
    stats = get_dashboard_stats()
    return render_template("home.html", user_name=user_name, stats=stats)


@home_bp.route("/worker/dashboard")
@login_required
def worker_dashboard():
    user_name = getattr(current_user, "full_name", "Worker")
    stats = get_dashboard_stats()
    return render_template("worker_dashboard.html", user_name=user_name, stats=stats)


@home_bp.route("/payment")
@login_required
def payment():
    """
    Payment page – shows the user's transactions, pending payments,
    or a payment form.
    """
    return render_template("payment.html")


@home_bp.route("/help")
@login_required
def help_page():
    return render_template("help.html")


# ============================================================
#  FIXED: /my-services – No access restriction!
#  Any logged‑in user can view this page.
# ============================================================
@home_bp.route("/my-services")
@login_required
def my_services():
    # No role restriction – any logged-in user can access
    services = [
        {"id": 1, "name": "Plumbing", "description": "Pipe repair, installation", "price": 45, "price_type": "hourly", "status": "active", "category": "Plumbing", "image": "plumbing.jpg", "rating": 4.8, "jobs_completed": 120, "earnings": 5400},
        {"id": 2, "name": "Electrical", "description": "Wiring, lighting, repairs", "price": 50, "price_type": "fixed", "status": "active", "category": "Electrical", "image": "electrical.jpg", "rating": 4.9, "jobs_completed": 85, "earnings": 4250},
        {"id": 3, "name": "Carpentry", "description": "Furniture, cabinetry, repairs", "price": 60, "price_type": "hourly", "status": "busy", "category": "Carpentry", "image": "carpentry.jpg", "rating": 4.7, "jobs_completed": 60, "earnings": 3600},
        {"id": 4, "name": "Cleaning", "description": "Deep cleaning, janitorial", "price": 35, "price_type": "hourly", "status": "offline", "category": "Cleaning", "image": "cleaning.jpg", "rating": 4.6, "jobs_completed": 200, "earnings": 7000},
    ]
    
    stats = {
        "total_services": len(services),
        "active_jobs": 7,
        "completed_jobs": 320,
        "pending_requests": 4,
        "total_earnings": 20250,
        "avg_rating": 4.75,
    }
    
    bookings = [
        {"id": 101, "customer": "John Doe", "service": "Plumbing", "date": "2026-07-12", "time": "10:00", "status": "upcoming"},
        {"id": 102, "customer": "Sarah M.", "service": "Electrical", "date": "2026-07-11", "time": "14:30", "status": "active"},
        {"id": 103, "customer": "Alex K.", "service": "Carpentry", "date": "2026-07-09", "time": "09:00", "status": "completed"},
        {"id": 104, "customer": "Mike B.", "service": "Cleaning", "date": "2026-07-13", "time": "08:00", "status": "pending"},
    ]
    
    return render_template("my_services.html", services=services, stats=stats, bookings=bookings)




    # Inside home.py, after the help_page route (or anywhere)

@home_bp.route("/request-repair")
@login_required
def request_repair():
    """Page where customers can submit a repair request and view live bids."""
    return render_template("request_repair.html")