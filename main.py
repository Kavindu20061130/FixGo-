from flask import Flask
from datetime import timedelta
import os

# Import db_session from login.py (where the session is created)
from backend.login import login_bp, login_manager, oauth, mail, db_session
from backend.home import home_bp
from flask_login import current_user

# Import models – User and Worker for the main user, UserDetails for completeness check
from db.database import User, Worker, UserDetails


# ---------------------------------
# Flask App Setup
# ---------------------------------
app = Flask(
    __name__,
    template_folder="frontend",
    static_folder="asset",
    static_url_path="/asset"
)

# ---------------------------------
# Security Configuration
# ---------------------------------
app.secret_key = "fixgo_super_secret_key_change_in_production"

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False   # Set True in production (HTTPS)
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)

# ---------------------------------
# Flask-Mail Configuration
# ---------------------------------
app.config["MAIL_SERVER"]          = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"]            = int(os.environ.get("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"]         = True
app.config["MAIL_USE_SSL"]         = False
app.config["MAIL_USERNAME"]        = os.environ.get("MAIL_USERNAME", "")
app.config["MAIL_PASSWORD"]        = os.environ.get("MAIL_PASSWORD", "")
app.config["MAIL_DEFAULT_SENDER"]  = os.environ.get(
    "MAIL_DEFAULT_SENDER",
    os.environ.get("MAIL_USERNAME", "noreply@fixgo.lk")
)

# ---------------------------------
# Extension Init
# ---------------------------------
login_manager.init_app(app)
oauth.init_app(app)
mail.init_app(app)

# ---------------------------------
# Blueprints
# ---------------------------------
app.register_blueprint(login_bp)
app.register_blueprint(home_bp)


# ============================================================
# 🔧 Global context processor – injects full user + details
# ============================================================
@app.context_processor
def inject_user():
    """
    Injects a full User or Worker object, the associated UserDetails
    (if any), and a boolean 'has_details' into all templates.
    This allows the UI to show a warning when profile information is missing.
    """
    if not current_user.is_authenticated:
        return {'user': None, 'user_details': None, 'has_details': False}

    role = getattr(current_user, 'role', None)
    pk = getattr(current_user, 'pk', None)

    user_obj = None
    details_obj = None
    has_details = False

    if role == 'worker':
        user_obj = db_session.query(Worker).filter(Worker.worker_id == pk).first()
        if user_obj:
            user_obj.account_type = 'Worker'
            user_obj.profile_pic = getattr(user_obj, 'profile_pic', None)
        # Workers may have a different details table; for now, we treat them as complete
        has_details = True
    else:
        user_obj = db_session.query(User).filter(User.user_id == pk).first()
        if user_obj:
            user_obj.account_type = 'Customer'
            user_obj.profile_pic = getattr(user_obj, 'profile_pic', None)
            # Check if this user has a record in UserDetails
            details_obj = db_session.query(UserDetails).filter(UserDetails.user_id == pk).first()
            has_details = details_obj is not None

    return {
        'user': user_obj,
        'user_details': details_obj,
        'has_details': has_details
    }


# ---------------------------------
# Root route
# ---------------------------------
@app.route("/")
def index():
    return "FixGo AI is running successfully 🚀"


# ---------------------------------
# Run Server
# ---------------------------------
if __name__ == "__main__":
    app.run(debug=True)