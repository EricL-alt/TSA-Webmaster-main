import json
from datetime import datetime
import requests as http_requests
from flask import Flask, render_template, request, url_for, redirect, flash, send_from_directory, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String, text
from flask_login import UserMixin, login_user, LoginManager, login_required, current_user, logout_user
import smtplib

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key-goes-here'


# CREATE DATABASE
class Base(DeclarativeBase):
    pass


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(model_class=Base)
db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'profile'
login_manager.login_message = 'Please log in to access this page.'


def contains_number(input_string):
    for character in input_string:
        if character.isdigit():
            return True
    return False


def contains_uppercase(input_string):
    for character in input_string:
        if character.isupper():
            return True
    return False


@login_manager.user_loader
def load_user(user_id):
    return db.get_or_404(User, user_id)


# CREATE TABLE
class User(UserMixin, db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(1000))
    comments_created: Mapped[int] = mapped_column(Integer, default=0)
    likes_received: Mapped[int] = mapped_column(Integer, default=0)


with app.app_context():
    db.create_all()
    # Migrate existing database to add new columns if they don't exist
    with db.engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE user ADD COLUMN comments_created INTEGER DEFAULT 0'))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text('ALTER TABLE user ADD COLUMN likes_received INTEGER DEFAULT 0'))
            conn.commit()
        except Exception:
            pass


@app.context_processor
def inject_globals():
    try:
        return dict(
            logged_in=current_user.is_authenticated,
            current_year=datetime.now().year,
            username=current_user.name,
        )
    except:
        return dict(
            logged_in=current_user.is_authenticated,
            current_year=datetime.now().year,
        )


# =============================================================================
# MAIN PAGE ROUTES
# =============================================================================

@app.route('/')
def home():
    return render_template("index.html", logged_in=current_user.is_authenticated)


@app.route('/about')
def about():
    return render_template("about.html", logged_in=current_user.is_authenticated)

@app.route('/suggest')
def suggest():
    return render_template("suggest.html", logged_in=current_user.is_authenticated)

@app.route('/references')
def references():
    return render_template("references.html", logged_in=current_user.is_authenticated)


@app.route('/profile')
def profile():
    if current_user.is_authenticated:
        return render_template("secrets.html",
                               name=current_user.name,
                               logged_in=True,
                               comments_created=current_user.comments_created or 0,
                               likes_received=current_user.likes_received or 0)
    return render_template("profile.html", logged_in=False)


@app.route('/settings')
@login_required
def settings():
    return render_template("settings.html", logged_in=True)


@app.route('/change_password', methods=['POST'])
@login_required
def change_password():
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    if not check_password_hash(current_user.password, current_password):
        flash('Current password is incorrect.')
        return redirect(url_for('settings'))

    if new_password != confirm_password:
        flash('New passwords do not match.')
        return redirect(url_for('settings'))

    if len(new_password) < 7:
        flash('Your password should be at least 7 characters long.')
        return redirect(url_for('settings'))

    if not contains_number(new_password):
        flash('Your password should have at least 1 number.')
        return redirect(url_for('settings'))

    if not contains_uppercase(new_password):
        flash('Your password should have at least 1 uppercase letter.')
        return redirect(url_for('settings'))

    current_user.password = generate_password_hash(
        new_password,
        method='pbkdf2:sha256',
        salt_length=8
    )
    db.session.commit()

    flash('Password changed successfully!')
    return redirect(url_for('settings'))


@app.route('/resources')
def resources():
    suggestions = load_suggestions()
    print(suggestions)
    return render_template("resources.html", sugestions=suggestions)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    return render_template("search.html", query=query, logged_in=current_user.is_authenticated)


@app.route('/events')
def events():
    return render_template("events.html", logged_in=current_user.is_authenticated)


# =============================================================================
# SUGGESTIONS / RESOURCES ROUTES
# =============================================================================

def load_suggestions():
    with open('suggestions.json', 'r') as f:
        return json.load(f)


def save_suggestions(suggestions):
    with open('suggestions.json', 'w') as f:
        json.dump(suggestions, f, indent=2)


@app.route('/suggestions')
def suggestions():
    suggestions = load_suggestions()
    return render_template('suggestions.html', suggestions=suggestions, logged_in=current_user.is_authenticated)


@app.route('/user/<int:index>')
def show_user_profile(index):
    suggestions = load_suggestions()
    if index < 0 or index >= len(suggestions):
        return "Resource not found", 404

    suggestion = suggestions[index]
    return render_template('resource.html',
                           title=suggestion[0],
                           image=suggestion[1],
                           category=suggestion[2],
                           info=suggestion[3],
                           link=suggestion[4],
                           address=suggestion[5],
                           phone=suggestion[6],
                           email=suggestion[7],
                           btype=suggestion[8],
                           area=suggestion[9],
                           comments=suggestion[10] if len(suggestion) > 10 else [],
                           resource_likes=suggestion[11] if len(suggestion) > 11 else 0,
                           index=index,
                           logged_in=current_user.is_authenticated,
                           current_user=current_user)


@app.route('/add_comment/<int:index>', methods=['POST'])
def add_comment(index):
    suggestions = load_suggestions()

    if index < 0 or index >= len(suggestions):
        return jsonify({'error': 'Resource not found'}), 404

    data = request.get_json()
    username = data.get('username', 'Anonymous')
    comment_text = data.get('comment', '')

    if not comment_text.strip():
        return jsonify({'error': 'Comment cannot be empty'}), 400

    # Ensure comments array exists
    if len(suggestions[index]) < 11:
        suggestions[index].append([])

    # Create comment object
    comment = {
        'username': username,
        'text': comment_text,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    suggestions[index][10].append(comment)
    save_suggestions(suggestions)

    # Increment comments_created for the logged-in user
    if current_user.is_authenticated:
        current_user.comments_created = (current_user.comments_created or 0) + 1
        db.session.commit()

    return jsonify({'success': True, 'comment': comment})


@app.route('/like_comment/<int:resource_index>/<int:comment_index>', methods=['POST'])
def like_comment(resource_index, comment_index):
    suggestions = load_suggestions()

    if resource_index < 0 or resource_index >= len(suggestions):
        return jsonify({'error': 'Resource not found'}), 404

    comments = suggestions[resource_index][10] if len(suggestions[resource_index]) > 10 else []

    if comment_index < 0 or comment_index >= len(comments):
        return jsonify({'error': 'Comment not found'}), 404

    comment = comments[comment_index]

    # Increment the like count stored in suggestions.json
    comment['likes'] = comment.get('likes', 0) + 1
    save_suggestions(suggestions)

    # Increment likes_received for the comment's author in the database
    comment_username = comment.get('username', '')
    if comment_username and comment_username != 'Anonymous':
        author = db.session.execute(db.select(User).where(User.name == comment_username)).scalar()
        if author:
            author.likes_received = (author.likes_received or 0) + 1
            db.session.commit()

    return jsonify({'success': True, 'likes': comment['likes']})


@app.route('/like_resource/<int:resource_index>', methods=['POST'])
def like_resource(resource_index):
    suggestions = load_suggestions()

    if resource_index < 0 or resource_index >= len(suggestions):
        return jsonify({'error': 'Resource not found'}), 404

    suggestion = suggestions[resource_index]

    # Ensure the resource has a likes field at index 11
    if len(suggestion) < 12:
        suggestion.append(0)

    suggestion[11] = suggestion[11] + 1
    save_suggestions(suggestions)

    return jsonify({'success': True, 'likes': suggestion[11]})


# =============================================================================
# AUTHENTICATION ROUTES
# =============================================================================

@app.route('/register', methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get('email')
        result = db.session.execute(db.select(User).where(User.email == email))

        # Note, email in db is unique so will only have one result.
        user = result.scalar()
        if user:
            # User already exists
            flash("You've already signed up with that email, log in instead!")
            return redirect(url_for('profile'))

        if not contains_number(request.form.get('password')):
            flash("Your password should have at least 1 number")
            return redirect(url_for('profile'))

        if not contains_uppercase(request.form.get('password')):
            flash("Your password should have at least 1 uppercase letter")
            return redirect(url_for('profile'))

        if len(request.form.get('password')) < 7:
            flash("Your password should be at least 7 characters long")
            return redirect(url_for('profile'))

        hash_and_salted_password = generate_password_hash(
            request.form.get('password'),
            method='pbkdf2:sha256',
            salt_length=8
        )
        new_user = User(
            email=request.form.get('email'),
            password=hash_and_salted_password,
            name=(request.form.get('first_name')+" "+request.form.get('last_name')),
        )
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user, remember=True)
        return redirect(url_for("secrets"))

    return render_template("register.html", logged_in=current_user.is_authenticated)


@app.route('/login', methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get('email')
        password = request.form.get('password')

        result = db.session.execute(db.select(User).where(User.email == email))
        user = result.scalar()

        # Email doesn't exist or password incorrect.
        if not user:
            flash("That email does not exist, please try again.")
            return redirect(url_for('profile'))
        elif not check_password_hash(user.password, password):
            flash('Password incorrect, please try again.')
            return redirect(url_for('profile'))
        else:
            login_user(user, remember=True)
            return redirect(url_for('secrets'))

    return render_template("login.html", logged_in=current_user.is_authenticated)


@app.route('/secrets')
@login_required
def secrets():
    print(current_user.name)
    return render_template("secrets.html",
                           name=current_user.name,
                           logged_in=True,
                           comments_created=current_user.comments_created or 0,
                           likes_received=current_user.likes_received or 0)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route('/download')
@login_required
def download():
    return send_from_directory('static', path="files/cheat_sheet.pdf")

@app.route('/send', methods=["GET", "POST"])
def send():
    if request.method == "POST":
        # Collect form data
        username = request.form.get('username', 'Anonymous')
        resource_name = request.form.get('resourceName', '')
        category = request.form.get('category', '')
        link = request.form.get('link', '')
        description = request.form.get('description', '')
        address = request.form.get('address', '')
        phone = request.form.get('phone-number', '')
        resource_email = request.form.get('email', '')

        # Submit to Web3Forms via server-side POST
        try:
            web3forms_data = {
                'access_key': '3435acb5-c2cf-4c3a-bdca-272828e9f719',
                'username': username,
                'resourceName': resource_name,
                'category': category,
                'link': link,
                'description': description,
                'address': address,
                'phone-number': phone,
                'email': resource_email,
            }
            web3_response = http_requests.post(
                'https://api.web3forms.com/submit',
                data=web3forms_data
            )
            print(f"Web3Forms response: {web3_response.status_code} - {web3_response.text}")
        except Exception as e:
            print(f"Web3Forms submission failed: {e}")

        # Send confirmation email if user is logged in
        if current_user.is_authenticated:
            try:
                sender_email = "hubmiami593@gmail.com"
                sender_password = "zbsh eyku nebj pmfc"

                subject = "Resource Suggestion Received"
                message = (
                    f"Hi {current_user.name},\n\n"
                    f"Thanks for submitting a suggestion! This helps advance our community by a lot.\n\n"
                    f"Here's what you submitted:\n"
                    f"  Resource: {resource_name}\n"
                    f"  Category: {category}\n"
                    f"  Link: {link}\n"
                    f"  Description: {description}\n"
                    f"  Address: {address}\n"
                    f"  Phone: {phone}\n"
                    f"  Email: {resource_email}\n\n"
                    f"Our officials are actively reviewing your suggestion.\n\n"
                    f"Thanks,\nMiami Hub"
                )

                text = f"Subject: {subject}\n\n{message}"
                server = smtplib.SMTP("smtp.gmail.com", 587)
                server.starttls()
                server.login(sender_email, sender_password)
                server.sendmail(sender_email, current_user.email, text)
                server.quit()
            except Exception as e:
                print(f"Email sending failed: {e}")

        flash("Thank you for your suggestion! It has been submitted for review.")
        return redirect(url_for('suggest'))

    return redirect(url_for('suggest'))

if __name__ == "__main__":
    app.run(debug=True,port=5002)