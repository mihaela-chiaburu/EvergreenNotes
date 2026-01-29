using EvergreenNotes.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Note> Notes { get; set; }
        public DbSet<Connection> Connections { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<NoteTag> NoteTags { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Username).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
            });

            // Note configuration
            modelBuilder.Entity<Note>(entity =>
            {
                entity.HasKey(n => n.Id);
                entity.Property(n => n.Title).IsRequired().HasMaxLength(500);
                entity.Property(n => n.Content).HasMaxLength(10000);
                entity.Property(n => n.SourceUrl).HasMaxLength(2000);
                entity.Property(n => n.SourceType).HasMaxLength(50);
                entity.Property(n => n.SourceThumbnail).HasMaxLength(2000);

                entity.HasOne(n => n.User)
                    .WithMany()
                    .HasForeignKey(n => n.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(n => n.UserId);
                entity.HasIndex(n => n.CreatedAt);
                entity.HasIndex(n => n.LastWateredAt);
            });

            // Connection configuration
            modelBuilder.Entity<Connection>(entity =>
            {
                entity.HasKey(c => c.Id);

                entity.HasOne(c => c.SourceNote)
                    .WithMany()
                    .HasForeignKey(c => c.SourceNoteId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.TargetNote)
                    .WithMany()
                    .HasForeignKey(c => c.TargetNoteId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.User)
                    .WithMany()
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(c => new { c.SourceNoteId, c.TargetNoteId }).IsUnique();
                entity.HasIndex(c => c.SourceNoteId);
                entity.HasIndex(c => c.TargetNoteId);
                entity.HasIndex(c => c.UserId);
            });

            // Tag configuration
            modelBuilder.Entity<Tag>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Name).IsRequired().HasMaxLength(100);

                entity.HasOne(t => t.User)
                    .WithMany()
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Prevent duplicate tag names per user
                entity.HasIndex(t => new { t.UserId, t.Name }).IsUnique();
                entity.HasIndex(t => t.UserId);
            });

            // NoteTag configuration (many-to-many join table)
            modelBuilder.Entity<NoteTag>(entity =>
            {
                entity.HasKey(nt => new { nt.NoteId, nt.TagId });

                entity.HasOne(nt => nt.Note)
                    .WithMany(n => n.NoteTags)
                    .HasForeignKey(nt => nt.NoteId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(nt => nt.Tag)
                    .WithMany(t => t.NoteTags)
                    .HasForeignKey(nt => nt.TagId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(nt => nt.NoteId);
                entity.HasIndex(nt => nt.TagId);
            });
        }
    }
}
