# authentication/forms.py

from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.contrib.auth import authenticate
from users.models import CustomUser  # Adjust the import if needed


class UserRegistrationForm(forms.ModelForm):
    """Form for registering a new user."""
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm Password", widget=forms.PasswordInput)

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'display_name']

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match.")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])  # hashes password
        if commit:
            user.save()
        return user


class UserLoginForm(forms.Form):
    """Form for logging in a user."""
    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput)

    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get("email")
        password = cleaned_data.get("password")
        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise forms.ValidationError("Invalid email or password.")
            if not user.is_active:
                raise forms.ValidationError("This account is inactive.")
            cleaned_data["user"] = user
        return cleaned_data
