from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='parent_category',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
