from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib import messages
from authentication.forms import UserLoginForm, UserRegistrationForm


def register_view(request):
    if request.method == "POST":
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Log user in after registration
            messages.success(request, "Registration successful. Welcome!")
            return redirect("home")  # Change to your home page URL name
    else:
        form = UserRegistrationForm()
    return render(request, "auth/register.html", {"form": form})


def login_view(request):
    if request.method == "POST":
        form = UserLoginForm(request.POST)
        if form.is_valid():
            user = form.cleaned_data.get("user")
            login(request, user)
            messages.success(request, f"Welcome back, {user.display_name or user.username}!")
            return redirect("home")
    else:
        form = UserLoginForm()
    return render(request, "auth/login.html", {"form": form})


def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect("login")  # Or wherever you want to send them
