# Generated by Django 5.1.3 on 2024-11-29 16:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='game',
            name='ball_x',
        ),
        migrations.RemoveField(
            model_name='game',
            name='ball_y',
        ),
        migrations.RemoveField(
            model_name='game',
            name='player1_score',
        ),
        migrations.RemoveField(
            model_name='game',
            name='player2_score',
        ),
        migrations.AddField(
            model_name='game',
            name='ball_direction',
            field=models.JSONField(default={'x': 1.0, 'y': 0.0}),
        ),
        migrations.AddField(
            model_name='game',
            name='ball_position',
            field=models.JSONField(default={'x': 50, 'y': 50}),
        ),
        migrations.AddField(
            model_name='game',
            name='ball_speed',
            field=models.IntegerField(default=5),
        ),
        migrations.AddField(
            model_name='game',
            name='ball_velocity',
            field=models.IntegerField(default=1),
        ),
        migrations.AddField(
            model_name='game',
            name='game_height',
            field=models.IntegerField(default=100),
        ),
        migrations.AddField(
            model_name='game',
            name='game_width',
            field=models.IntegerField(default=200),
        ),
        migrations.AddField(
            model_name='game',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='game',
            name='paddle_height',
            field=models.IntegerField(default=20),
        ),
        migrations.AddField(
            model_name='game',
            name='paddle_speed',
            field=models.IntegerField(default=5),
        ),
        migrations.AddField(
            model_name='game',
            name='score',
            field=models.JSONField(default={'player1': 0, 'player2': 0}),
        ),
        migrations.AlterField(
            model_name='game',
            name='paddle1_y',
            field=models.IntegerField(default=50),
        ),
        migrations.AlterField(
            model_name='game',
            name='paddle2_y',
            field=models.IntegerField(default=1),
        ),
    ]
