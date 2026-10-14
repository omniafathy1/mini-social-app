import { Image, Send, Smile, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { usePosts } from '../hooks/usePosts';

export default function CreatePost() {
	const [content, setContent] = useState('');
	const [selectedImage, setSelectedImage] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const fileInputRef = useRef(null);
	const { createPost, isCreating } = usePosts();

	const handlePhotoButtonClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setSelectedImage(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const handleRemoveImage = () => {
		setSelectedImage(null);
		setPreviewUrl(null);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const resetForm = () => {
		setContent('');
		handleRemoveImage();
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		const trimmedContent = content.trim();

		if ((!trimmedContent && !selectedImage) || isCreating) return;

		createPost(
			{ content: trimmedContent, image: selectedImage },
			{ onSuccess: resetForm }
		);
	};

	return (
		<section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgb(15,23,42,0.05)]">
			<div className="flex gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20">M</div>
				<form onSubmit={handleSubmit} className="min-w-0 flex-1">
					<textarea
						value={content}
						onChange={(event) => setContent(event.target.value)}
						placeholder="What's on your mind?"
						rows={2}
						className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
					/>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						className="hidden"
					/>

					{previewUrl && (
						<div className="relative mt-3 inline-block">
							<img src={previewUrl} alt="Selected preview" className="max-h-48 rounded-xl object-cover" />
							<button
								type="button"
								onClick={handleRemoveImage}
								aria-label="Remove image"
								className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-md hover:bg-slate-700"
							>
								<X size={14} />
							</button>
						</div>
					)}

					<div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
						<div className="flex items-center gap-1 text-slate-400">
							<button
								type="button"
								aria-label="Add photo"
								onClick={handlePhotoButtonClick}
								className="rounded-full p-2 transition hover:bg-emerald-50 hover:text-emerald-600"
							>
								<Image size={18} />
							</button>
							<button type="button" aria-label="Add feeling" className="rounded-full p-2 transition hover:bg-amber-50 hover:text-amber-600"><Smile size={18} /></button>
						</div>
						<button
							type="submit"
							disabled={(!content.trim() && !selectedImage) || isCreating}
							className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
						>
							<Send size={15} />
							{isCreating ? 'Posting...' : 'Post'}
						</button>
					</div>
				</form>
			</div>
		</section>
	);
}